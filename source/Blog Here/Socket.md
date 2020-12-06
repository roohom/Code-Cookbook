# Socket
网络通信程序
- 客户端
    - java.net.Socket
    - 作用   
        - 创建一个客户端对象，用来连接服务端程序，并向服务端发送数据和接收数据
    - 使用
        - Socket client = new Socket("服务端IP",port)
    - 常用内容
        - 连接服务端
            - 使用构造方法:
                - Socket client = new Socket(服务端IP,port)    
        - 发送数据:
            - 利用IO流 OutputStream
            - OutputStream output = new client.getOutputStream()        
              output.write(byte)
            - InputStream input = new client.getInputStream()
              byte[] buf = new byte[1024];
              int len = input.read(buf);
        - 接收数据:
            - String str = new String(buf,0,len)
- 服务端
    - java.net.ServerSocket
    - 作用
        - 创建一个服务端对象，等待客户端的链接，并获取到一个Socket对象(用来和客户端进行交互)
    - 使用
        - ServerSocket ss = new ServerSocket(port)
    - 常用内容
        - 创建服务端对象
            - 利用构造方法
                - ServerSocket ss = new ServerSocket(port)
        - 等待客户端链接
            - 利用方法
                - Socket socket = ss.accept()
        - 接收数据
            - 利用Socket中的InputStream
                - InputStream input = new socket.getInputStream()
        - 发送数据
            - 利用OutputStream
                - OutputStream output = new socket.getOutputStream()