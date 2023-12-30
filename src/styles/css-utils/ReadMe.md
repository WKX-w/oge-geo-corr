# CSS基础设施

本目录下定义了一些常用的CSS类，以供在HTML(JSX)中快速应用通用样式。

类名如`Flex`，`Scroll-area`，`Background`等均以大写字母开头，由连字符和小写单词组合而成。建议谨慎定义新的通用CSS类型，因这可能降低样式的可维护性，并增大CSS代码文件大小。通用样式的灵感来自[tailwindcss](https://tailwindcss.com/)，但是缺少**按需引入**和**预编译系统**。