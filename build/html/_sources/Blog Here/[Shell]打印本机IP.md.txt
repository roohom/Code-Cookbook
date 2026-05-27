# [Shell]打印本机IP

- 如何快速得到本机IP？此操作收集于Kudu官网一行命令：

  ~~~shell
  echo $(ifconfig | grep "inet " | grep -Fv 127.0.0.1 |  awk '{print $2}' | tail -1)
  ~~~

- 可能有用