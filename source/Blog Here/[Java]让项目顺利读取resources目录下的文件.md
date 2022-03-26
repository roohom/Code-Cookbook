# [Java]让项目顺利读取resources目录下的文件

当我们建立起浩大的Java代码工程后，难免地就会将一些不变或者不易变化的属性放在配置文件中，而将配置文件放置在我们的项目的resources目录下，将所有的配置打包入jar，再将jar部署到服务器运行，这是一个普通的思路。

当我们尝试像读取一个位置下的文件一样去读取这个文件时，却和我们想象的不一样了，程序抛出了以下异常：

~~~java
Exception in thread "main" java.io.FileNotFoundException: stream.json (No such file or directory)
~~~

提示找不到我们的所制定的目标文件，这种方法不奏效了。



## 正确姿势

下面准备了两种方法

### 一

先准备一个常用的util方法，用来读取文件

我们把名为`stream.json`的文件放在项目的resources目录下

~~~java
    @SneakyThrows
    public static String readFileFromResources(InputStream inputStream) {
        BufferedReader bufferedReader = null;
        String content = "";
        try {
            InputStreamReader inputStreamReader = new InputStreamReader(inputStream, StandardCharsets.UTF_8);
            bufferedReader = new BufferedReader(inputStreamReader);

            String temp = null;
            while ((temp = bufferedReader.readLine()) != null) {
                content += temp + "\n";
            }
            bufferedReader.close();

        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (bufferedReader != null) {
                try {
                    bufferedReader.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        return content;
    }
~~~

直接读取

~~~java
InputStream resourceStream = App.class.getClassLoader().getResourceAsStream("stream.json");
String bJson = readFileFromResources(resourceStream);
System.out.println(bJson);
~~~

### 二

准备一个util用来读取文件

~~~java
public static String readFileFromResources(String path) {
        ClassPathResource classPathResource = new ClassPathResource(path);
        BufferedReader bufferedReader = null;
        String content = "";
        try {
            InputStream inputStream = classPathResource.getInputStream();
            InputStreamReader inputStreamReader = new InputStreamReader(inputStream, StandardCharsets.UTF_8);
            bufferedReader = new BufferedReader(inputStreamReader);

            String temp = null;
            while ((temp = bufferedReader.readLine()) != null) {
                //读取每一行，在每一行之后加一个换行,这是因为在IDEA里面会将SQL自动格式化,行结尾和下一行头会"无缝"连接在一起
                content += temp + "\n";
            }
            bufferedReader.close();

        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (bufferedReader != null) {
                try {
                    bufferedReader.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        return content;
    }
~~~

引入依赖：

~~~xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <version>5.2.8.RELEASE</version>
</dependency>
~~~



直接读取

~~~java
//3 -> correct
String cJson = readFileFromResources("stream.json");
System.out.println(cJson);
~~~



