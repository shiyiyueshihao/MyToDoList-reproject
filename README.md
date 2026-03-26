# Tauri + Vue + TypeScript

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)




这是一份为您量身定制的 ToDoList 本地桌面软件设计方案与开发文档 。

基于您提供的 SKILL.md 规范，我为您设计了一套现代化、专业且易于上手的架构方案。按照您的要求，本文档仅提供设计规划和手把手的步骤拆解，不涉及直接修改您的代码文件。

# 📑 ToDoList 桌面端软件设计方案
## 1. 产品定位与基础设定
- 产品形态 ：Windows 本地常驻桌面软件。
- 窗口设定 ：固定宽度 400px，高度 600px，不可拉伸缩放（保证 UI 布局完美呈现）。
- 核心功能 ：
  1. 待办事项的增删改查、状态切换。
  2. 支持为每个待办事项上传一张图片，列表内显示缩略图。
  3. 双击缩略图，弹出全屏原图预览。
## 2. UI/UX 设计规范 (严格遵循 SKILL.md)
为了让您的软件看起来像专业团队开发的产品，我们将遵循以下核心规则：

- 交互与点击 (Touch & Interaction) ：所有的操作按钮（删除、完成勾选）的点击热区 不得小于 44x44px ，防止误触。点击和悬停需要有 150ms-300ms 的平滑过渡动画（Animation timing）。
- 视觉与图标 (Icons & Visual Elements) ： 严禁使用 Emoji 作为功能图标（例如不要用 ❌ 代表删除），必须统一使用高质量矢量图标（推荐 Lucide）。
- 间距与布局 (Layout & Spacing) ：遵循 8px/16px 间距系统 。列表项之间、内边距必须保持有节奏的呼吸感。
- 全屏预览遮罩 (Scrim and modal legibility) ：双击图片弹出的原图预览层，背景必须使用 40%-60% 透明度的黑色遮罩，确保背景内容被弱化，突出图片主体。
- 色彩对比度 (Light/Dark Mode Contrast) ：文字与背景的对比度需满足至少 4.5:1，避免使用纯黑，推荐使用深灰（如 slate-900 ）提升专业感。
## 3. 技术选型与依赖说明
为了开发这个轻量级的桌面软件，我们将采用 Tauri + Vue 3 + TypeScript 的黄金组合。

技术/工具 作用说明 (为什么需要它？) Vue 3 + TS 前端核心。Vue 3 的组合式 API 开发效率极高，TypeScript 提供代码提示，避免低级错误。 Tauri 桌面端框架 。相比于老旧庞大的 Electron，Tauri 底层使用 Rust 语言，打包出来的软件体积极小（通常几MB），内存占用低，非常适合做 400x600 的常驻桌面小工具。 Rust Tauri 的底层依赖语言。 必须安装它 ，因为最后把网页打包成 .exe 桌面程序的工作是由 Rust 编译器完成的。 Pinia Vue 官方状态管理库。用来在内存中统一管理你的待办事项列表数据。 VueUse Vue 实用工具库。我们将使用它的 useStorage 功能， 一行代码即可实现数据自动保存到本地 （关掉软件再打开，待办和图片依然存在）。 Lucide-vue-next 矢量图标库。提供专业的 SVG 图标，满足 SKILL.md 中“不使用 Emoji”的要求。

# 🚀 从零开始的保姆级开发指南
如果您是第一次做桌面端开发，请严格按照以下步骤顺序执行：

### 第一阶段：系统环境准备（仅需配置一次）
因为 Tauri 需要编译桌面应用，所以需要准备底层编译环境：

1. 安装 Visual Studio C++ 构建工具 ：
   - 原因 ：Windows 系统下编译 Rust 必备的 C++ 链接器。
   - 操作 ：下载 Visual Studio Installer，勾选“使用 C++ 的桌面开发”进行安装。
2. 安装 Rust ：
   - 原因 ：Tauri 打包 .exe 程序的引擎。
   - 操作 ：前往 Rust 官网下载 rustup-init.exe ，一直回车默认安装即可。
3. 安装 Node.js ：
   - 原因 ：提供 npm 命令，用于安装 Vue 相关的前端依赖。
   - 操作 ：前往 Node.js 官网下载长期支持版 (LTS) 安装。
### 第二阶段：初始化项目
打开您的终端（CMD 或 PowerShell），进入 2026-03-24(ToDoList) 文件夹，执行：

```
npm create tauri-app@latest
```
- 输入项目名称 ：比如 my-todo-app
- Choose your package manager : 选择 npm
- Choose your UI template : 选择 Vue
- Choose your UI flavor : 选择 TypeScript
- 解释 ：这个官方脚手架会自动为您搭建好 Vue 3 前端页面和 Tauri 的 Rust 后端桥接文件，省去繁琐的手动配置。
 

	示例图如下
 
### 第三阶段：配置固定窗口大小（核心需求）
进入刚创建的项目目录，找到 src-tauri/tauri.conf.json 文件，修改 windows 配置项：

```
"windows": [
  {
    "title": "My ToDoList",
    "width": 400,
    "height": 600,
    "resizable": false,    // 禁止用
    户拉伸窗口
    "fullscreen": false,   // 禁用全
    屏
    "decorations": true    // 保留顶
    部关闭/最小化状态栏
  }
]
```
- 解释 ：确保您的软件一打开就是完美的 400x600 比例，且用户无法拖拽边缘改变大小，从而保证您的 UI 设计不会变形。
### 第四阶段：安装前端业务依赖
在项目根目录打开终端，执行以下命令：

```
npm install
npm install pinia @vueuse/core 
lucide-vue-next
```
- 解释 ：
  - npm install ：下载脚手架默认的依赖。
  - 第二条命令：安装我们在【技术选型】中提到的状态管理、本地存储持久化工具和专业图标库。
### 第五阶段：核心代码开发思路指引
准备好环境后，您就可以在 src 目录下愉快地写 Vue 代码了。这里提供核心功能的实现思路：

1. 数据结构定义 (TypeScript) ：
   ```
   interface TodoItem {
     id: string;
     content: string;
     isDone: boolean;
     thumbnailBase64?: string; // 存
     储图片的 Base64 字符串
   }
   ```
2. 图片上传与存储思路 ：
   由于是本地软件，不需要后端服务器。您可以放置一个 <input type="file" accept="image/*"> 隐藏按钮。用户选择图片后，使用 JavaScript 的 FileReader 将图片转换为 Base64 字符串，然后借助 VueUse 的 useStorage ，直接随待办事项一起存入本地存储（localStorage）。
3. 列表缩略图与双击放大 ：
   - 缩略图 ：在列表项中使用 <img> 标签，配合 CSS width: 60px; height: 60px; object-fit: cover; cursor: pointer; 保持图片不被拉伸且暗示可点击。
   - 双击放大 ：给缩略图绑定 @dblclick="preview(item.thumbnailBase64)" 。
   - 全屏 Modal ：在页面最外层写一个全屏的 div ，使用 position: fixed; inset: 0; background: rgba(0,0,0,0.6); (遵循 60% 黑色遮罩规范)，里面居中展示原图。绑定 @click 事件点击遮罩关闭。
### 第六阶段：开发调试与最终打包
1. 日常开发预览 ：
   ```
   npm run tauri dev
   ```
   - 解释 ：这会同时启动 Vue 的热更新和桌面窗口。您修改代码，桌面软件的画面会实时更新。
2. 生成最终的 .exe 桌面软件 ：
   ```
   npm run tauri build
   ```
   - 解释 ：当您开发完成，执行此命令。Rust 编译器会启动，将您的网页代码打包压缩，最终在 src-tauri/target/release/ 目录下生成一个可以直接双击运行、发给别人也能用的 .exe 独立安装包/程序。
您可以按照这个文档逐步开始配置环境和初始化项目。在开发过程中如果遇到具体代码的编写问题（例如不知道怎么写双击放大的组件），随时可以向我提问，我会为您提供符合 SKILL.md 规范的具体代码！
