# 昼夜交界 SVG

`rebuild-day-night.py` 是当前首页插画的维护源。方法沿用原先暮色观测台 demo：分层轮廓、从原图取样的平滑色场、独立纸纹、专门绘制的望远镜。没有使用整图描摹，也没有嵌入位图。

在 Windows PowerShell 中运行：

```powershell
conda run -n dl_env python scripts/artwork/rebuild-day-night.py --source 'C:/Users/30674/Desktop/天文首页方案生成图/01_昼夜交界_原图进化.png' --output 'public/images/home/day-night.svg'
```

原始参考图由使用者提供，通过 `--source` 指定；要求尺寸为 1672 × 941。脚本使用现有环境里的 OpenCV、NumPy、SciPy。构建网站不需要运行此脚本或安装 Python，只需要生成好的 SVG。

- `layers` 中的地标坐标维护山峰、谷地、岩石和前景的构图。
- `smooth_path` 对转角进行受控曲线连接，保留有意义的峰谷。
- `field` 只从该物体可见区域内部采色，避免邻接物体的颜色污染边缘。
- `surface-texture` 为独立纹理层，不改变几何轮廓。
- `telescope` 使用局部坐标、直线、曲线和旋转变换。

每次修改后检查整图与山脊、前景、望远镜的同尺度放大对照，并检查浏览器实际渲染。纹理是程序化重建，不承诺与原图逐像素一致。不得为了平滑边缘而直接模糊整幅画。

## 02–20 插画集合

`collection_scenes.py` 分别定义十九幅图的主体、曲线、桥拱、穹顶、路径、天体和限定区域内的岩层。`scene_renderer.py` 负责取色、图层裁切、局部轮廓整理和独立纸纹；不会用整图自动描摹代替几何设计。

```powershell
conda run -n dl_env python scripts/artwork/build-collection.py --source-dir 'C:/Users/30674/Desktop/天文首页方案生成图'
node scripts/artwork/render-collection.mjs 'C:/Users/30674/Desktop/天文首页方案生成图'
```

可用 `--only 3 10` 重绘指定编号。渲染脚本可在路径后追加编号，只更新对应预览。SVG 放在 `public/images/home/study-XX.svg`；后台缩略图放在 `public/images/home/thumbs/`；原图对照和整组总览放在本地忽略目录 `.design-qa/collection/`。渲染脚本会把已生成的 20 幅预览组合成总览，所以首次应完整运行。

后台注册表为 `src/lib/home-artworks.ts`，不要变更已保存样式的 ID。新增素材不应修改数据库当前选择。
