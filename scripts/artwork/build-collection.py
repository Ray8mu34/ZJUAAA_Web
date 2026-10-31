from pathlib import Path
import argparse
import json
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from scene_renderer import Scene
from collection_scenes import SCENES

ROOT=Path(__file__).resolve().parents[2]

def build_one(task):
    number,source,output=task
    title=Path(source).stem.split('_',1)[1]
    scene=Scene(source,title)
    SCENES[number](scene)
    report=scene.render(output)
    return dict(number=number,title=title,file=Path(output).name,**report)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--source-dir',type=Path,required=True)
    parser.add_argument('--output-dir',type=Path,default=ROOT/'public/images/home')
    parser.add_argument('--only',type=int,nargs='*')
    args=parser.parse_args()
    args.output_dir.mkdir(parents=True,exist_ok=True)
    tasks=[]
    for number in (args.only or list(range(2,21))):
        source=next(args.source_dir.glob(f'{number:02d}_*.png'))
        tasks.append((number,str(source),str(args.output_dir/f'study-{number:02d}.svg')))
    reports=[]
    with ProcessPoolExecutor(max_workers=2) as pool:
        for f in as_completed([pool.submit(build_one,t) for t in tasks]):
            result=f.result();reports.append(result)
            print(json.dumps(result,ensure_ascii=False),flush=True)
    report_path=ROOT/'.design-qa/collection-build.json'
    report_path.parent.mkdir(exist_ok=True)
    previous=json.loads(report_path.read_text(encoding='utf-8')) if report_path.exists() else []
    by_id={r['number']:r for r in previous+reports}
    report_path.write_text(json.dumps(sorted(by_id.values(),key=lambda r:r['number']),ensure_ascii=False,indent=2),encoding='utf-8')
