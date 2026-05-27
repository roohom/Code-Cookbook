# [Shell] Zip命令

## 基础使用

使用：

~~~shell
zip [选项] 文件名.zip  /xxx/路径xxx/文件
~~~



~~~
-v		：可视化操作，显示压缩的执行过程，默认就是可视化
-q		： 静默操作，不显示指令执行过程
-r 		：表示递归打包包含子目录的全部内容
-d		：从压缩文件内删除指定的文件
-n		：n为一个数字，压缩级别是从 1~9 的数字，-1 代表压缩速度更快，-9 代表压缩效果更好
-e   	：加密压缩文件 
-u		:追加文件到zip压缩包中
~~~



举例：

~~~shell
zip -vr etc.zip /etc/				#压缩/etc/目录，压缩文件名为etc.zip
zip -e passwd.zip  /etc/passwd 		#加密压缩，需要输入密码
zip -u passwd.zip mypasww.txt		#追加mypasww.txt文件到压缩包中
~~~



## 着重介绍

~~~shell
zip -d myfile.zip smart.txt			#删除压缩文件中的指定文件
~~~

删除压缩文件包里面的内容不仅可以解压删除再压缩，还可以用上面的命令。

比如想删除名为`flink-shaded-hadoop-3-uber-3.1.1.7.2.8.0-224-9.0.jar`的jar包里面的`javax.servlet`则可以使用以下命令

~~~shell
zip -d flink-shaded-hadoop-3-uber-3.1.1.7.2.8.0-224-9.0.jar javax/servlet/\*
~~~

