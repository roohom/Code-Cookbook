# 本地连接需要Kerberos认证的Hive

代码中使用如下来进行认证：

~~~java
System.setProperty("java.security.krb5.conf", "PATH\TO\krb5.conf");
System.setProperty("HADOOP_USER_NAME", "username");
System.setProperty("user.name", "username");
UserGroupInformation.loginUserFromKeytab("username@DOMAIN.COM", "PATH\TO\keytab\username.keytab");
~~~

