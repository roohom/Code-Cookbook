# [Shell]将字符串转换为数字进行大小比较

## 背景

有一个shell脚本中有这样一个代码段:

~~~shell
#!/bin/bash
py=`date +%Y`
pm=`date +%m`


if (( $pm  < 4 ));then
   py=$(( $py-1 ))
   pm=4
else
   pm=$(( ($pm-1)/3 ))
fi
~~~

其功能是获得当前日期的上一个季度的值，在运行时报错:

~~~
((: 08: value too great for base (error token is "08")
~~~



## 解决

### 原因分析

原因在于pm=`date +%m`解析得到的结果是08，这个结果值会被shell解析为8进制，08超出了8进制表示的范围，所以会报value too great for base。

### 解决

将结果值转换为10进制即可，对脚本进行改造,使用`10#`标注于变量前。

~~~shell
#!/bin/bash
py=`date +%Y`
pm=`date +%m`


if (( 10#$pm  < 4 ));then
   py=$(( $py-1 ))
   pm=4
else
   pm=$(( (10#$pm-1)/3 ))
fi
~~~

