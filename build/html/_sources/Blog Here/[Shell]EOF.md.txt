# [Shell]EOF

- Shell中通常将EOF与 << 结合使用，表示后续的输入作为子命令或子Shell的输入，直到遇到EOF为止，再返回到主调Shell。
   可以把EOF替换成其他东西，意思是把内容当作标准输入传给程序。

- 例子：自动登录[mysql](http://www.jbxue.com/db/mysql/)（root:root,passwd:123456),查询test库，查询其中所有的记录。

  ~~~shell
  #!/bin/bash
  mysql -uroot -p123456 <<EOF
  use test;
  SELECT * FROM TEST;
  exit
  EOF
  ~~~

> 当然，EOF还可以替换成其他任意字符串，但必须是**要成对出现**

