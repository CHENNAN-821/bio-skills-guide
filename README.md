# 生信 Skills 学习站

中文生信 AI Skills 教程与资源导航。包含 14 节教程、8 项技能与课程资源、浏览器端 FASTA 练习，以及 PDF、Word 和配套练习下载。

## GitHub Pages 发布

本项目是无需构建的静态网站。把根目录中的全部文件推送至仓库的 `main` 分支，然后进入 **Settings → Pages → Build and deployment**，选择 **Deploy from a branch**，分支选 **main**，目录选 **/(root)**，保存。

项目网站地址由 GitHub 提供，不需要自定义域名。实际地址以 Pages 设置显示的地址为准。

## 本地预览

可以直接用浏览器打开 `index.html`。也可以在此目录运行 `python -m http.server 8765`，再访问终端打印的本机地址。浏览器练习、搜索与复制均在客户端执行，网站没有数据上传接口。

## 内容与功能

- `guide/`：完整的分章节教程，支持目录与上一节／下一节。
- `resources.html`：按类别和关键词筛选资源，浏览器本地收藏。
- `practice.html`：严格 ATGC FASTA 统计与 CSV 导出，仅用于入门练习。
- `downloads/`：本教程的 PDF、Word 和配套练习文件。
- `assets/style.css`：页面样式；`assets/app.js`：交互功能。
- `assets/search-index.js`：本地搜索索引；修改教程时也应更新相应索引。

学习进度与资源收藏只保存在当前浏览器中；不跨设备同步。阅读预计用时是学习参考，不是服务指标。

## 资料与许可

资料核对日期：2026-11-13。网站内容为学习资源导读和教学示例，来源见资源导航页。第三方项目、代码与文档遵循各自许可。没有把原项目源码或全部课程内容重新分发到本仓库。

配套练习已在 Python 3.12 与 Biopython 1.88 下运行并核对预期 CSV。完整 RNA-seq 和单细胞流程应按真实数据与实验设计另外验证。

浏览器 GC 练习的输入不上传；GitHub Pages 平台本身可能记录访问日志，具体见 GitHub 的隐私说明。
