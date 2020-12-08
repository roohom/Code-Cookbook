# Docker

## Overview

> Docker是一个开源的容器引擎，是一种容器技术，解决软件跨环境迁移问题

Docker本身并不是容器，它是创建容器的工具，是应用容器引擎

两句口号：

- “Build, Ship and Run”。也就是，“搭建、发送、运行”
- “Build once，Run anywhere（搭建一次，到处能用）”



## 启动和停止

~~~shell
操作 指令
启动docker 		systemctl start docker
停止docker 		systemctl stop docker
重启docker 		systemctl restart docker
查看docker状态	   systemctl status docker
开机启动 	   	   systemctl enable docker
查看docker概要信息 	docker info
查看docker帮助文档 	docker --help
~~~



