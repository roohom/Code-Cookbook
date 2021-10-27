# [Shell]Shell脚本日期递增(起止日期内递增)

**SHELL脚本的调试：**

可以使用`bash -v $your_shell_script`命令来调试脚本，使用该命令之后，将会显示脚本中每一步运行的结果，好用极啦！



**通用模板如下：**

~~~shell
#!/bin/bash
echo "DATE FORMAT IS %Y-%m-%d"

if [ $# == 0 ] 
then
   echo "PLEASE INPUT [START_DATE AND END_DATE)"
   exit
fi

if [ $# == 1 ]
then
	echo "YOU NEED TO INPUT START_DATE OR END_DATE"
	exit
fi

start_day=$1
end_day=$2

echo "$start_day"
echo "$end_day"

while (( `date -d "$start_day" +%Y%m%d`<=`date -d "$end_day" +%Y%m%d`))
do
    echo "today is $start_day"
    start_day=`date -d "$start_day +1 day" +%Y-%m-%d`
    if [[ $start_day == $end_day ]];
    then
         break
    fi
done
~~~



**一个应用：**

- Hive通过运行SQL文件的形式跑历史数据

  - 需要支持起止日期，也就是传入开始和结束日期来跑历史数据
  - 前一天开始跑数之后不能立即跑下一天，需要等待一定时间或者等待前一天跑完

- SHELL脚本如下：

  > 文件名为：event.sh

  ~~~shell
  #!/bin/bash
  echo "DATE FORMAT IS %Y-%m-%d"
  
  kinit -kt /path/to/keytab username
  
  if [ $# == 0 ] 
  then
     echo "PLEASE INPUT [START_DATE AND END_DATE)"
     exit
  fi
  
  if [ $# == 1 ]
  then
  	echo "YOU NEED TO INPUT START_DATE OR END_DATE"
  	exit
  fi
  
  start_day=$1
  end_day=$2
  
  echo "$start_day"
  echo "$end_day"
  
  while (( `date -d "$start_day" +%Y%m%d`<=`date -d "$end_day" +%Y%m%d`))
  do
      hive \
      -hivevar start_day=$start_day \
      -f event.sql
      start_day=`date -d "$start_day +1 day" +%Y-%m-%d`
      if [[ $start_day == $end_day ]];
      then
           break
      fi
  done
  ~~~

- 上面的SHELL脚本将会调用下面的Hive SQL文件：

  > 文件名为：event.sql

  ~~~SQL
  SET hive.execution.engine=spark;
  SET spark.master=yarn-cluster;
  SET spark.driver.cores=2;
  SET spark.driver.memory=2g;
  SET spark.executor.instances=5;
  SET spark.executor.cores=4;
  SET spark.executor.memory=5g;
  SET hive.spark.client.future.timeout=180;
  SET spark.app.name=sa_rtm_to_ods_rtm;
  
  MSCK REPAIR TABLE rtm.sa_rtm;--修复元数据，一般不需要
  
  INSERT OVERWRITE TABLE rtm.ods_rtm PARTITION(year='2021', dt = '${hivevar:start_day}')
  SELECT * FROM rtm.sa_rtm
  WHERE dt='${hivevar:start_day}';
  ~~~

> 说明：上面的SHELL脚本和下面的HiveSQL文件需要在一个目录下，或者在shell脚本中使用hive执行文件命令的地方写出sql文件的绝对路径
>
> 直接运行event.sh脚本并输入起止日期即可启动

**再一个应用：**

如果有一个脚本需要跑历史数据，并且<u>只需要历史日期为周日的那天才执行</u>，那么可以使用下面的脚本：

> `date -d 2021-10-27 +%w`用于判断是不是周日，如果是周日，那么返回结果为0，为周一则返回1...

~~~shell
#!/bin/bash
echo "DATE FORMAT IS %Y-%m-%d"

if [ $# == 0 ] 
then
   echo "PLEASE INPUT [START_DATE AND END_DATE)"
   exit
fi

if [ $# == 1 ]
then
	echo "YOU NEED TO INPUT START_DATE OR END_DATE"
	exit
fi
now=`date +"%Y-%m-%d %H:%M:%S"`

start_day=$1
end_day=$2
job_name=$3

echo "$now -------INFO: start_day has set as $start_day-----------"
echo "$now -------INFO: end_day has set as $end_day    -----------"
echo "$now -------INFO: job_name has set as $job_name  -----------"

while (( `date -d "$start_day" +%Y%m%d`<=`date -d "$end_day" +%Y%m%d`))
do  
    echo "`date +"%Y-%m-%d %H:%M:%S"` -------INFO: today is $start_day   -----------"
    next_day=`date -d "$start_day +1 day" +%Y-%m-%d`
    echo "`date +"%Y-%m-%d %H:%M:%S"` -------INFO: next day is $next_day   -----------"
    if [ `date -d $start_day +%w` -eq 0 ]
    then 
        echo "这里执行实际的脚本......"
    else
        echo "`date +"%Y-%m-%d %H:%M:%S"` -------INFO: $start_day不是周日 ---------------"
    fi
    start_day=`date -d "$start_day +1 day" +%Y-%m-%d`
    if [[ $start_day == $end_day ]];
    then
         break
    fi
done
~~~

