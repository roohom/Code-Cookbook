# [Java]生产者消费者模型问题



> Java中的多线程问题

**生产者消费者模型**是多线程中的典型案例。当多线程在运行过程中涉及到了对共享资源进行修改时，就会引起线程安全问题，为了解决此安全问题，便引入了同步机制。

- 解决方案:
    - 本质:把多线程变成单线程   
    - 引入线程同步机制(三种方法)
        - 同步代码块
            - 针对run方法中的代码，使用synchronized关键字，把部分代码添加同步机制
                - 同步机制:在同一个而时间，只能有一个线程执行
                    - 原理:线程在执行之前先获取到一个锁，然后开始执行线程任务，只有拿到锁的线程执行完包含在synchronized代码块中的内容之后，才会释放锁，才可以让其他线程拿到这个锁
                - 同步机制，关键是实现利用:锁(对象锁)  
                    - 锁: 对象锁。任何对象都可以当锁使用
                        - String lock = new String()
                        - Object lock = new Object()
        - 同步方法
            - 针对方法进行同步，同步方法只能用在方法上
            - 格式:public synchronized void method(){...}
            - 同步方法中的锁:
                - 非静态方法:锁是this(锁，当前对象)
                - 静态方法:静态方法没有对象的概念。所示Class(锁，类名.class)
        - 锁机制

### 典型案例一:milk_glass:牛奶生产者和消费者问题

- 奶箱类(Box)：定义一个成员变量，表示第x瓶奶，提供存储牛奶和获取牛奶的操作

- 生产者类(Producer)：实现Runnable接口，重写run()方法，调用存储牛奶的操作

- 消费者类(Customer)：实现Runnable接口，重写run()方法，调用获取牛奶的操作



实现代码:

奶箱:

~~~java
/**
 * ClassName: Box
 * Author: Roohom
 * Function:奶箱
 * Date: 2020/8/2 21:09
 * Software: IntelliJ IDEA
 */
public class Box {
    //定义一个成员变量，表示第x瓶奶
    private int milk;
    //定义一个成员变量，表示奶箱的状态
    private boolean state = false;

    //提供存储牛奶和获取牛奶的操作
    public synchronized void put(int milk) {
        //如果有牛奶，等待消费
        if(state) {
            try {
                wait();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        //如果没有牛奶，就生产牛奶
        this.milk = milk;
        System.out.println("送奶工将第" + this.milk + "瓶奶放入奶箱");
        //生产完毕之后，修改奶箱状态
        state = true;
        //唤醒其他等待的线程
        notifyAll();
    }

    public synchronized void get() {
        //如果没有牛奶，等待生产
        if(!state) {
            try {
                wait();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        //如果有牛奶，就消费牛奶
        System.out.println("用户拿到第" + this.milk + "瓶奶");

        //消费完毕之后，修改奶箱状态
        state = false;

        //唤醒其他等待的线程
        notifyAll();
    }
}

~~~

Producer and Customer：

~~~java
/**
 * ClassName: Producer
 * Author: Roohom
 * Function:生产者
 * Date: 2020/8/2 21:10
 * Software: IntelliJ IDEA
 */
public class Producer implements Runnable {
    private Box b;

    public Producer(Box b) {
        this.b = b;
    }

    @Override
    public void run() {
        for(int i=1; i<=5; i++) {
            b.put(i);
        }
    }
}
/**
 * ClassName: Customer
 * Author: Roohom
 * Function:消费者
 * Date: 2020/8/2 21:10
 * Software: IntelliJ IDEA
 */
public class Customer implements Runnable {
    private Box b;

    public Customer(Box b) {
        this.b = b;
    }
    @Override
    public void run() {
        while (true) {
            b.get();
        }
    }
}
/**
 * ClassName: Customer
 * Author: Roohom
 * Function:消费者
 * Date: 2020/8/2 21:10
 * Software: IntelliJ IDEA
 */
public class Customer implements Runnable {
    private Box b;

    public Customer(Box b) {
        this.b = b;
    }
    @Override
    public void run() {
        while (true) {
            b.get();
        }
    }
}
~~~

测试类:

~~~java
/**
 * ClassName: ProducerAndCustomer
 * Author: Roohom
 * Function:
 * Date: 2020/8/2 21:08
 * Software: IntelliJ IDEA
 */
public class ProducerAndCustomer {
    public static void main(String[] args) {
        //创建奶箱对象，这是共享数据区域
        Box b = new Box();

        //创建生产者对象，把奶箱对象作为构造方法参数传递，因为在这个类中要调用存储牛奶的操作
        Producer p = new Producer(b);
        //创建消费者对象，把奶箱对象作为构造方法参数传递，因为在这个类中要调用获取牛奶的操作
        Customer c = new Customer(b);

        //创建2个线程对象，分别把生产者对象和消费者对象作为构造方法参数传递
        Thread t1 = new Thread(p);
        Thread t2 = new Thread(c);

        //启动线程
        t1.start();
        t2.start();
    }
}

~~~

### 典型案例二:多线程猜数字游戏

问题描述:

~~~markdown
* 用两个线程玩猜数字游戏，第一个线程负责随机给出1~100之间的一个整数，第二个线程负责猜出这个数。
* 要求每当第二个线程给出自己的猜测后，第一个线程都会提示“猜小了”、“猜大了”或“猜对了”。 猜数之前，要求第二个线程要等待第一个线程设置好要猜测的数。
* 第一个线程设置好猜测数之后，两个线程还要相互等待。
* 其原则是：第二个线程给出自己的猜测后，等待第一个线程给出的提示；第一个线程给出提示后，等待给第二个线程给出猜测。
* 如此进行，直到第二个线程给出正确的猜测后，两个线程进入死亡状态
~~~

实现代码:

猜数字类，类似于奶箱:

~~~java
/**
 * ClassName: NumGuess
 * Author: Roohom
 * Function:两个线程猜数字游戏
 * Request: * 用两个线程玩猜数字游戏，第一个线程负责随机给出1~100之间的一个整数，第二个线程负责猜出这个数。
 *          * 要求每当第二个线程给出自己的猜测后，第一个线程都会提示“猜小了”、“猜大了”或“猜对了”。 猜数之前，要求第二个线程要等待第一个线程设置好要猜测的数。
 *          * 第一个线程设置好猜测数之后，两个线程还要相互等待。
 *          * 其原则是：第二个线程给出自己的猜测后，等待第一个线程给出的提示；第一个线程给出提示后，等待给第二个线程给出猜测。
 *          * 如此进行，直到第二个线程给出正确的猜测后，两个线程进入死亡状态
 * Date: 2020/8/2 20:10
 * Software: IntelliJ IDEA
 */
public class NumGuess {
    //线程一随机生成的让线程二猜的数字
    private int num;
    //线程二随机生成的猜的数字
    private int gsNum;
    //猜没猜数字
    private boolean guess = false;
    //给没给数字
    private boolean give = false;
    //记录开关状态，用于停止程序
    boolean stop = false;
    //用来记录猜数字的区间，为了将猜数字的范围缩小
    private int min = 1;
    private int max = 100;
    //用来计数猜了多少次的计数器
    int count = 1;

    public synchronized void generateNum() {
        //如果当前执行的线程是生成数者，也就是第一个线程，并且还没有给出一个数字让第二个线程来猜，那么就需要生成一个数字
        if (!give) {
            //如果没有数字就生成数字
            num = (int) (Math.random() * 100) + 1;
            System.out.println("第一个线程正在设置数字...");
            System.out.println("本次设置的数字是:" + num);

            //生成数字之后，现在有数字了，修改数字状态为true
            give = true;
        }
        //如果没猜，就等着第二个线程来猜数字
        while (!guess) {
            try {
                wait();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        if (num > gsNum) {
            min = gsNum + 1;
            System.out.println("第1个线程回答:猜小了");
        } else if (num < gsNum) {
            System.out.println("第1个线程回答:猜大了");
            max = gsNum - 1;
        } else {
            System.out.println("第1个线程回答:你猜的数字是" + gsNum);
            System.out.println("猜对啦！");
            //猜对了程序就可以停下来了，将stop置为true
            stop = true;
            //return;
        }
        //没猜，或者猜的都不对，就相当于没猜，那么将guess置为false
        guess = false;
        //通知第二个线程，现在可以来猜了，也就是唤醒第二个线程
        notifyAll();
    }

    public synchronized void guessNum() {
        //如果第二个线程猜了，等待线程一给出提示
        while (guess) {
            try {
                wait();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        //如果猜的不对，程序就不需要停止，线程二还需要继续猜，也就是再生成一个数
        if (!stop) {
            gsNum = (int) (Math.random() * (max - min)) + min;
            System.out.println("第2个线程第" + (count++) + "次猜的数字是:" + gsNum);
            //猜过数字了
            guess = true;
        }
        //通知线程一线程二猜过了，可以进行判断了，也就是唤醒等待中的线程一
        notifyAll();
    }
}
~~~

给出数字让猜的类:

~~~java
/**
 * ClassName: NumGenerator
 * Author: Roohom
 * Function:
 * Date: 2020/8/2 20:44
 * Software: IntelliJ IDEA
 */
public class NumGenerator implements Runnable{

    private NumGuess n;

    public NumGenerator(NumGuess n) {
        this.n = n;
    }

    @Override
    public void run() {
        //如果猜的不对，线程一就不需要结束
        //一开始没有数字就生成一个数字，有了数字就进行给线程二提示
        while (!n.stop )
            n.generateNum();
    }
}

~~~

猜数字者:

~~~java
/**
 * ClassName: NumGuesser
 * Author: Roohom
 * Function:
 * Date: 2020/8/2 20:46
 * Software: IntelliJ IDEA
 */
public class NumGuesser implements Runnable {

    private NumGuess n;

    public NumGuesser(NumGuess n) {
        this.n = n;
    }

    @Override
    public void run() {
        //如果猜的不对，线程二就一直猜，直到猜对
       while (!n.stop)
           n.guessNum();
    }
}

~~~

测试类:

~~~java
/**
 * ClassName: GuessNumTest
 * Author: Roohom
 * Function:
 * Date: 2020/8/2 20:47
 * Software: IntelliJ IDEA
 */
public class GuessNumTest {
    public static void main(String[] args) {
        //公用的资源类，里面有共享的变量，类似于生产者和消费者共用的资源，
        NumGuess n = new NumGuess();
        //将资源作为参数传入数字生成者和猜数者
        NumGenerator gen = new NumGenerator(n);
        NumGuesser gue = new NumGuesser(n);

        //实例化两个线程，启动两个线程
        Thread t1 = new Thread(gen,"generator");
        Thread t2 = new Thread(gue,"guesser");
        t1.start();
        t2.start();
    }
}

~~~



