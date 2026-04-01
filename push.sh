#!/bin/bash

# 检查是否有未提交的变更
if git status | grep -q "Changes not staged for commit\|Untracked files"; then
  echo "有未提交的变更，请先提交再运行此脚本。"
  exit 1
fi

# 推送代码
echo "正在推送代码..."
git push

if [ $? -eq 0 ]; then
  echo "代码推送成功！"
else
  echo "代码推送失败，请检查网络连接或权限。"
  exit 1
fi