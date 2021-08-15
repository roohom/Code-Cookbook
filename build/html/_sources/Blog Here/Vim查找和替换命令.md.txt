# Vim查找和替换命令

- 在Vim编辑器中查找并替换

  ~~~shell
  vi/vim 中可以使用 :s 命令来替换字符串。
  
  :s/well/good/ 替换当前行第一个 well 为 good
  
  :s/well/good/g 替换当前行所有 well 为 good
  
  :n,$s/well/good/ 替换第 n 行开始到最后一行中每一行的第一个 well 为 good
  
  :n,$s/well/good/g 替换第 n 行开始到最后一行中每一行所有 well 为 good n 为数字，若 n 为 .，表示从当前行开始到最后一行
  
  :%s/well/good/（等同于 :g/well/s//good/） 替换每一行的第一个 well 为 good
  
  :%s/well/good/g（等同于 :g/well/s//good/g） 替换每一行中所有 well 为 good 可以使用 # 作为分隔符，此时中间出现的 / 不会作为分隔符
  
  :s#well/#good/# 替换当前行第一个 well/ 为 good/
  
  :%s#/usr/bin#/bin#g 可以把文件中所有路径/usr/bin换成/bin
  
  ~~~

  

- 替换也可以使用sed和grep组合

  ~~~shell
  sed -i s/yyyy/xxxx/g `grep yyyy -rl --include="*.txt" ./`
  
  作用：将当前目录(包括子目录)中所有txt文件中的yyyy字符串替换为xxxx字符串。其中，
  
  -i 表示操作的是文件，``括起来的grep命令，表示将grep命令的的结果作为操作文件。
  
  s/yyyy/xxxx/表示查找yyyy并替换为xxxx，后面跟g表示一行中有多个yyyy的时候，都替换，而不是仅替换第一个
  
  另外，如果不需要查找子目录，仅需要在当前目录替换，用sed命令就行了，命令如下：sed -i s/xxxx/yyyy/g ./*.txt
  
  ~~~

- 查找和替换

  ~~~shell
  find -name '要查找的文件名' | xargs perl -pi -e 's|被替换的字符串|替换后的字符串|g'          #查找替换当前目录下包含字符串并进行替换
  
  find -name '*.txt' | xargs perl -pi -e 's|被替换内容|替换内容|g'             #递归查找替换
  
  find . -type f -name '*.html' | xargs perl -pi -e 's|被替换内容|替换内容|g'
  
  ~~~

  