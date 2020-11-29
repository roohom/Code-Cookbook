# JDBC
JDBC规范（掌握四个核心对象，都在java.sql下）：

- DriverManager：用于注册驱动
- Connection: 建立与数据库的连接
- Statement: 操作数据库sql语句的对象
- ResultSet: 结果集或一张虚拟表



- 操作步骤:
    - 在idea中导入mysql驱动包
    - 在java程序中注册mysql驱动
        - Class.forName("驱动包")
            - 加载(注册)后的数据驱动，会同意由DriverManager类来管理
            - 此代码一般书写在静态代码块里
        
    - 使用jdbc中的常用API对象，进行数据库连接
        - 数据库的链接需要通过DriverManager类来调用驱动，实现和数据库的链接，连接成功返回Connect对象
        - `String url = "jdbc:mysql://localhost:3306/"`
        - `Connection condb = DriverManager.getConnecction(url[ip,port],username,password)`
    - 使用JDBC常用API对象，操作数据库中的表(使用mysql语句)
        - String sql = "select * from table_name" //insert update delete
        - 使用Statement来进行数据库操作
        - Statement stmt = condb.createStatement();
        - 执行sql查询
            - ResultSet rs = stmt.executeQuery("select * from table_name")
            - 从获取的结果集向下移动一行，并判断是否有记录存在
                - rs.next()
                - 
                    ~~~java
                    while(rs.next)
                    {
                        rs.getInt("cid");//从结果集取出int类型的字段
                        rs.getIng("age");
                        rs.getStrinh("cname");
                        rs.getInt(1);//根据指定的索引获取表中相应的字段下的数据(数据表中的索引从1开始)
                    }
                    ~~~
    - 接收数据库表后的结果
        
        - 查询的结果集(执行了select语句之后，会生成一张临时的虚拟表)
    - 释放资源
        - rs.close()
        - stmt.close()
        - conndb.close()
        
        
## 预处理对象
jdb针对SQL注入问题，提供一个预处理对象，java.sql.PreparedStatement
- 使用
    ~~~java
        PrepaerdStatement pstmt = conndb.preparedStatement(String sql)
        在jdbc中针对预编译的sql语句，可以使用占位符:? , 来表示要添加的参数
        String sql = "select * from 表名 where id = ? and name=?";
        //可以使用preparedStatement给占位符传递参数？
        pstmt.setInt(占位符序号，传递的具数据) //占位符从1开始
        pstmt.setString(2,"张三")
      
        //执行
        pstmt.ecexuteQuery(); //五参数
    ~~~
## 连接池
存放多个连接的集合
- 使用目的:解决建立数据库连接耗费资源和时间很多的问题，提高性能
- 常见连接池:C3P0、DRUID 
- C3P0连接池
    -  C3P0是开源免费的数据库连接池。目前使用它的开源项目有：Spring、Hibernate等。使用C3P0连接池需要导入jar包
    - 开发步骤:
        - 1、idea中创建项目工程
        - 2、在项目工作中导入jar包（数据库的驱动包、c3p0的jar包）
        - 3、编写配置文件 c3p0-config.xml，放在src中（注：文件名一定不要写错）
        - 4、编写工具类
    - 参数说明
        - initialPoolSize : 初始连接数  刚创建好连接池的时候准备的连接数量
        - maxPoolSize : 最大连接数 连接池中最多可以放多少个连接
        - checkoutTimeout : 最大等待时间 连接池中没有连接时最长等待时间
        - maxIdleTime : 最大空闲回收时间 连接池中的空闲连接多久没有使用就会回收

    

## 事务
数据库中的事务:为了确保多条SQL语句执行完成，在SQL语句执行之前开始事物，在所有的SQL语句执行结束之后，结束事物(提交，回滚)
- 作用:
    
    - 保证在一个事务中多次SQL操作要么全都成功，要么全都失败，保障的是数据的安全性、完整性
- 开启事物:
    start transaction
- 执行多条SQL语句并提交
- 回滚
    rollback 
- 原理:
    - 没有开启事务
        - SQL语句会直接操作数据库中的数据
    - 开启了事务
        - SQL语句会缓存在日志中，不会直接啊哦做数据库中的数据
        - commit--缓存的SQL语句会操作数据库中的数据
        - rollback--销毁缓存的数据    
    
- 事物特征:ACID
    - 原子性Atomicity
    - 一致性Consistency
    - 隔离性Isolation
    - 永久性Durability
- 并发问题
    - 脏读：一个事务读到了另一个事务未提交的数据.
    - 不可重复读：一个事务读到了另一个事务已经提交(update)的数据。引发另一个事务，在事务中的多次查询结果不一致。
    - 虚读 /幻读：一个事务读到了另一个事务已经提交(insert/delet)的数据。导致另一个事务，在事务中多次查询的结果不一致。

        