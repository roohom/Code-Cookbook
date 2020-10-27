# 使用Java在服务端和客户端之间传送文件
> 此文记录了小白在实现一个简单的由客户端上传文件至服务端遇到的坑和解决办法


- 需求描述
    - 实现客户端发送文件到服务端
    - 当文件发送完成之后由服务端发送反馈给客户端，内容是“文件上传成功！”

- 具体问题(坑)
    - 当客户端向服务端发送文件之后，客户端可以将文件读完并成功执行后续代码，但是服务端一直无法向下执行，从而不能发送反馈给客户端
    
- 实现代码如下，在代码里有详细的执行解释:    
服务端:
~~~java
import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;

/**
 * ClassName: UpLoadFile
 * Author: Roohom
 * Function:文件接收服务端
 * Date: 2020/8/3 20:22
 * Software: IntelliJ IDEA
 */
public class FileRecServer {
    public static void main(String[] args) {
        try {
            ServerSocket ss = new ServerSocket(9999);
            Socket server = ss.accept();

            System.out.println("已连接的客户端IP为:" + server.getInetAddress());

            InputStream input = server.getInputStream();

            //本第流，写文件
            OutputStream os = new FileOutputStream("RecData.txt");

            Thread.sleep(100);
            byte[] buf = new byte[1024];
            int len;
            while ((len=input.read(buf))!=-1)
            {
                os.write(buf,0,len);
            }

            OutputStream output = server.getOutputStream();
            output.write("服务端的回复:上传成功!".getBytes());

            //释放资源
            os.close();
            input.close();
            output.close();
            ss.close();
            server.close();

        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
    }
}
~~~

客户端:
~~~java
import java.io.*;
import java.net.Socket;

/**
 * ClassName: UpLoadClient
 * Author: Roohom
 * Function:文件上传客户端
 * Date: 2020/8/3 20:23
 * Software: IntelliJ IDEA
 */
public class UpLoadClient {
    public static void main(String[] args) {
        try {
            Socket client = new Socket("192.168.1.104", 9999);
            OutputStream output = client.getOutputStream();

            //本地流，本地读文件
            InputStream is = new FileInputStream("data.txt");

            System.out.println("开始上传...");
            int len =-1;
            byte[] buf = new byte[1024];

            while ((len = is.read(buf))!=-1)
            {
                //对服务端写文件
                output.write(buf,0,len);
                System.out.println("客户端上传中...");
            }
            /*关键代码开始*/
            //不关闭客户端的输出流则会导致服务端一直阻塞
            //当客户端读到-1时，就没进入循环，所以-1就没写到服务端，故服务端就接收不到-1，所以一直不能停止循环，陷入等待客户端的状态
            client.shutdownOutput();
            /*关键代码结束*/
            is.close();
            //接收服务端的反馈
            InputStream input = client.getInputStream();
            byte[] newBuf = new byte[1024];
            int length = input.read(newBuf);
            String newStr = new String(newBuf,0,length);
            System.out.println(newStr);

            //释放资源
            is.close();
            input.close();
            output.close();
            client.close();

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
~~~

- 问题分析:
    - 在客户端上传文件时，使用的是
        ~~~java
        int len = -1;
        byte[] buf = new byte[1024];
        
        while ((len = is.read(buf))!=-1)
        {
          //对服务端写文件
          output.write(buf,0,len);
          System.out.println("客户端上传中...");
        }
        ~~~
      这种方式读文件，而在服务端也同样是这种方式读，当客户端读到-1时，就没进入循环，所以-1就没写到服务端，
      故服务端就接收不到-1，所以一直不能停止循环，陷入等待客户端的状态。所以就必须在读完文件之后，加上一句client.shutdownOutput() 来告诉服务端已经把数据读完了。
      
    
- 直接知道结果
    
    - 在客户端读完文件后加上语句`client.shutdownOutput()`      