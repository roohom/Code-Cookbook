# `IO Stream`

[TOC]

<a id=top></a>

## 字节流
- 分类:
    - 字节输入流
        - 顶层父类:InputStream
        - 用字节流读取文件
            - FileInputStream
            - ~~~
              int len=-1;
              byte[] buf = new byte[1024];
              while((len=fis.read())!=-1)
              {
                    str = new String(buf,0,len);
              }
              ~~~
    - 字节输出流
        - 顶层父类:OutputStream
        - 用字节流写文件
            - FileOutputStream
            - bos.write(byte[] buf, int offset, int len)
            - 如:bos.write(buf,0,len);
常用方法
- `FileOutputStream` 写
  
    - `write(int b)` 向文件中写入一个字节数据
    - `write(byte[] buf)` 向文件中写入多个字节数据(把字节数组中的数据全部写入)
    - `write(byte[] buf, int offset, int len)` 向文件中写入多个字节数据
        - `byte[] buf` : 是字节数组
        - `int offset` : 索引位置(起始位置)  
        - `int len`    : 长度(偏移量),向后取len个字节的数据
    - `close()` 关闭输出流        
    
    - 补充String类中的方法
        - 字符串转byte数组 即:`String` -> `byte[]`
        - `byte[] getBytes[]`
        
    - 可能出现的问题以及解决办法:
        - 没有换行
            - 解决:在`write()`中添加"\r\n"
        - 写入的数据将之前的存在的数据都覆盖了   
            - 解决:`FileOutputStream类`的构造方法中有一个参数boolean append用来进行是否在原数据后追加写入，是的话，设置为true
- `FileInputStream` 读
    - `close()` 关闭流
    - `int read()` 读一个字节数据
    - `int read(byte[] bys)` 读取多个字节,读取最多buf.length()个字节数据，并存储到 buf数组，返回实际读取到的字节数据个数   
    - `int read(byte[] bys, int offset, int len)` 从起始位置offset开始读取len个长度的字节
    
- 读写结合，一种高速的写方法
    - 示例:
        ~~~java
        public class FileCopy {
            public static void main(String[] args) {
                FileInputStream fis = null;
                FileOutputStream fos = null;
                try {
                    fis = new FileInputStream("D:\\initialD.png");
                    fos = new FileOutputStream("D:\\copy\\initialD.jpg");
                    byte[] buf = new byte[1024];
                    /*
                    //一个字节一个字节地读
                    int c ;
                    while ((c=fis.read())!=-1)
                        fos.write(c);
        
                     */
                    int len ;
                    while ((len = fis.read(buf)) != -1) {
                        fos.write(buf, 0, len);
                    }
                    
                } catch (IOException e) {
                    e.printStackTrace();
                } finally {
                    try {
                        assert fis != null;
                        fis.close();
                        assert fos != null;
                        fos.close();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
        ~~~
    
## <a id="jump">高效流</a>
高效流:字节高效流、字符高效流
- 字节高效流：    
    - 本质:字节输入缓冲流只是提供缓冲区，本身不能读取文件，需要依赖于字节输入流实现读取数据
    - 缓冲流内置一个缓冲区，默认大小是:8*1024(可以修改)
    - 字节输入缓冲流:BufferedInputStream
        - 高效的字节输入流, 封装 普通的字节输入流, 提供缓冲区
        - `public BufferedInputStream(InputStream is)`
        - 示例:`BufferedInputStream bis = new BufferedInputStream(new FileInputStream("file_path"))`
        - 常用方法`read()`
    - 字符输出缓冲流:BufferedOutputStream
        - 高效的字节输出流, 封装 普通的字节输出流, 提供缓冲区
        - `public BufferedOutputStream(OutputStream is)`
        - 示例:`BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream("file_path"))`
        - 常用方法`write()`
        - `flush()`
    
- 字符高效流
    - BufferedReader()
        - BufferedReader() br = new BufferedReader(new FileReader(String Path/File file))        
        
    - BufferedWriter()  
        - BufferedWtiter() bw = new BufferedWriter(new FileWriter(String Path/File file))      
        
## 字符流
字符流:针对纯文本文件进行读写操作的流
- 本质:底层还是字节流(把字节流进行封装)
- 分类:
    - 字符输入流
        - 顶层父类:Reader
        - 读文件:FileReader
            - FileReader fr = new FileReader(String path/ File file)
            - ~~~
              int len=-1;
              char[] buf = new char[1024];
              while((len = fr.read())!=-1)
              {
                    String Str = new String(buf,0,len);
              }
              ~~~
    - 字符输出流
        - 顶层父类:Writer
        - 写文件:FileWriter
            - FileWriter fw = new FileWriter();
            - ~~~
              FileWriter fw = new FileWriter(String path/ File file);
              fw.write(buf,0,len);
              ~~~
    
- 字符输出流:`FileWriter`类
    - 构造方法
        - `FileWriter(String Path)`
        - `FileWriter(File file)`
        - `FileWriter(String path, boolean append)`
        - `FileWriter(File file, boolean b)`

    - 常用方法
        - `close()`
        - `write()`
        - `write(char[] cbuf, int offset, int len)` 写入多个字符数据
        - `write(String str, int offset, int len)` 把字符串中部分数写入到文件
        - `flush()`

- 字符输入流:`FileReader`类
    - 构造方法:
        - `FileReader(File file)`
        - `FileReader(String path)`        
    - 常用方法:
        - `int read()` //读取一个字符，需要转换为char
        - `int read(char[] cbuf)` 读取多个字符，最多读cbuf.length个字符数据，返回实际读取到的字符个数
## 转换流
字符流内部有:编码表、内置缓冲区  
字符流的本质是字节流   
一个中文:GBK中占两个字节,UTF-8中占三个字节 
- 功能:
    - 把字节流转换为字符流: `InputStreamReader`
        - `InputStreamReader(InputStream in)`
        - `InputStreamReader(InputStream in, String charsetName)`
        - InputStreamReader isr = new InputStreamReader(new FileInputStream(String Path))
        
    - 把字符流转换为字节流: `OutputStreamWriter`
        - `OutputStreamWriter(OutputStream out)` param:字节输出流(FileOutputStream)
        - `OutputStreamWriter(OutputStream out, String charsetName)` params:字节输出流(FileOutputStream)、编码表名称
        - OutputStreamReader isr = new OutputStreamReader(new FileOutputStream(String Path))
### `InputStreamReader`:把字节流转换字符流的转换流
### `OutputStreamWriter`:把字符流转换为字节流的转换流         

## 字符缓冲流
类似于高效流
- 字符缓冲流:
    - `BufferedReader` 字符输入缓冲流
        - `BufferedReader(Reader in)`
        - `BufferedReader(Reader in.int size)` `params`:字符输入流FileReader , 自定义缓冲区大小
        - 特有方法:`readLine()` 读一行数据(以`\r\n`作为读取的结束符号) 
    - `BufferedWriter` 字符输出缓冲流
        - `BufferedWriter(Writer out)`
        - `BufferedWriter(Writer out, int size)`
        - 特有方法:`newLine()`  -> 相当于`\r\n`
        
        
        
## 总结:
### 字节流:
字节流是**万能流**，可以针对任何类型文件，如文本，视频，图片...
- 基础流，知道怎么用即可
- 开发中使用的高效流(借助基础流)        
    - 读文件: 针对多个字节数据的读取
    - 写文件: 针对多个字节数据的写入
    - Template: [详细使用](#jump)
        ~~~
        读:
          BufferedInputStream bis = new BufferedInputStream(new FileInputStream("file_path"))
          byte[] buf = new byte[1024];
          int len=-1;
          while((len=bis.read(buf))!=-1)
          {
                bis.write(buf,0,len);
          }
          flush();
        ~~~
    
### 字符流
- 基础流:FileReader、FileWriter
- 缓冲流:
    - 读文件: 针对多个字节进行读 -> 读一行
    - 写文件: 多个字节写入到文件 -> 写一行
    - Template:
        ~~~
        String line = null;
        while((line = 输入流.readLine())!=null)
        {
            输出流.write(line);
            输出流.newLine();
        }
        ~~~
### 转换流
在开发中当需要针对特殊编码(不是常用编码)的文件进行读写操作时 
针对的是纯文本文件，非文本文件不能使用，使用后，非文本文件不能使用     


## 序列化流
序列化:在java中书写的类，具备了序列化的特征，只有具备了序列化的特征才能实现对象的序列化
类需要实现一个序列化接口(Serializable接口)



[返回顶部](#top)