# [Java]设计模式

## 0、策略模式Strategy Pattern

### overview

> 来一点菜鸟教程上的介绍(帮助理解，拿来用用，读书人怎么能叫抄呢？)：

- 意图：定义一系列的算法,把它们一个个封装起来, 并且使它们可相互替换。

- 主要解决：在有多种算法相似的情况下，使用 if...else 所带来的复杂和难以维护。

- 何时使用：一个系统有许多许多类，而区分它们的只是他们直接的行为。

- 如何解决：将这些算法封装成一个一个的类，任意地替换。

- 关键代码：实现同一个接口。

- 应用实例： 1、诸葛亮的锦囊妙计，每一个锦囊就是一个策略。 2、旅行的出游方式，选择骑自行车、坐汽车，每一种旅行方式都是一个策略。 3、JAVA AWT 中的 LayoutManager。

- 优点： 1、算法可以自由切换。 2、避免使用多重条件判断。 3、扩展性良好。

- 缺点： 1、策略类会增多。 2、所有策略类都需要对外暴露。

- 使用场景： 1、如果在一个系统里面有许多类，它们之间的区别仅在于它们的行为，那么使用策略模式可以动态地让一个对象在许多行为中选择一种行为。 2、一个系统需要动态地在几种算法中选择一种。 3、如果一个对象有很多的行为，如果不用恰当的模式，这些行为就只好使用多重的条件选择语句来实现。

### Demo

> 菜鸟教程上的演示案例写得简单易懂，这里直接抄了，哦不，引用，读书人怎么能叫抄呢？

1、首先创建一个Strategy接口，我们的策略都要实现这一个接口

~~~java
public interface Strategy {
   public int doOperation(int num1, int num2);
}
~~~

2、创建实现接口的实体类

加法运算的策略

~~~java
public class OperationAdd implements Strategy{
   @Override
   public int doOperation(int num1, int num2) {
      return num1 + num2;
   }
}
~~~



减法运算的策略

~~~java
public class OperationSubtract implements Strategy{
   @Override
   public int doOperation(int num1, int num2) {
      return num1 - num2;
   }
}
~~~



乘法运算的策略

~~~java
public class OperationMultiply implements Strategy{
   @Override
   public int doOperation(int num1, int num2) {
      return num1 * num2;
   }
}
~~~



3、创建Context类

~~~java
public class Context {
   private Strategy strategy;
 
   public Context(Strategy strategy){
      this.strategy = strategy;
   }
 
   public int executeStrategy(int num1, int num2){
      return strategy.doOperation(num1, num2);
   }
}
~~~



4、Context类可以查看改变策略时的行为变化

~~~java
public class StrategyPatternDemo {
   public static void main(String[] args) {
      Context context = new Context(new OperationAdd());    
      System.out.println("10 + 5 = " + context.executeStrategy(10, 5));
 
      context = new Context(new OperationSubtract());      
      System.out.println("10 - 5 = " + context.executeStrategy(10, 5));
 
      context = new Context(new OperationMultiply());    
      System.out.println("10 * 5 = " + context.executeStrategy(10, 5));
   }
}
~~~



5、执行结果

~~~
10 + 5 = 15
10 - 5 = 5
10 * 5 = 50
~~~



## 1、模板方法模式

### overview

> 模板方法模式就是在模板方法中按照一定的规则和顺序调用基本方法。

**优点：** 1、封装不变部分，扩展可变部分。 2、提取公共代码，便于维护。 3、行为由父类控制，子类实现。

**缺点：**每一个不同的实现都需要一个子类来实现，导致类的个数增加，使得系统更加庞大。

**使用场景：** 1、有多个子类共有的方法，且逻辑相同。 2、重要的、复杂的方法，可以考虑作为模板方法。

**注意事项：**为防止恶意操作，一般模板方法都加上 final 关键词。

### Demo

~~~java
public abstract class HummerModel { 
/*
 * 首先，这个模型要能够被发动起来，别管是手摇发动，还是电力发动，反正
 * 是要能够发动起来，那这个实现要在实现类里了
 */
protected abstract void start(); 
 
//能发动，那还要能停下来，那才是真本事
protected abstract void stop(); 
 
//喇叭会出声音，是滴滴叫，还是哔哔叫
protected abstract void alarm(); 
 
//引擎会轰隆隆的响，不响那是假的
protected abstract void engineBoom(); 
 
//那模型应该会跑吧，别管是人推的，还是电力驱动，总之要会跑
final public void run() { 
 
 //先发动汽车
 this.start(); 
 
 //引擎开始轰鸣
 this.engineBoom(); 
 
 //喇嘛想让它响就响，不想让它响就不响
 if(this.isAlarm()){ 
 this.alarm(); 
 } 
 
 //到达目的地就停车
 this.stop(); 
 } 
 
//钩子方法，默认喇叭是会响的
protected boolean isAlarm(){ 
 return true; 
 } 
} 
~~~

上面的isAlarm()叫做钩子方法，子类可以重写。run方法定义了调用其他方法的顺序，并且子类不能修改，这叫做模板方法。

start、stop、alarm、engineBoom 这四个方法是子类必须实现的，而且这四个方法的修改对应了不同的类，这个叫做基本方法，基本方法又分为三种：在抽象类中实现了的基本方法叫做具体方法；在抽象类中没有实现，在子类中实现了叫做抽象方法，我们这四个基本方法都是抽象方法，由子类来实现的；还有一种就是钩子方法。

## 2、单例模式

> 在整个软件系统中有些对象值需要实例化一个，并不需要每次用到时都去实例化一个新的对象。

### 饿汉式

- 好处
  - 天然的线程安全的
- 坏处
  - 对象一开始就加载，可能长时间用不到

一个示例：

~~~java
/**
 * 饿汉式 HUNGRY
 * 静态方法最先加载，当加载完成之后调用内部静态对象(实例化一个Bank对象)
 * 当实例化成功之后，由于不能调用Bank的实例化方法直接new一个对象，只能
 * 使用提供的公共的静态方法去取已经实例化好的静态对象，所以每次调用Bank得到的都是
 * 同一个预先加载好的静态对象
 * 坏处：对象加载之后可能一直用不到，创建时间过长
 * 好处：是线程安全的
 *
 * @author roohom
 */
public class Bank {
    /**
     * 私有化类的构造器
     */
    private Bank() {

    }

    /**
     * 内部类创建的对象，要求此对象和静态的方法一致也是静态的
     */
    private static Bank bankInstance = new Bank();


    /**
     * 提供公共静态的方法，返回类的对象
     *
     * @return 类的对象
     */
    public static Bank getInstance() {
        return bankInstance;
    }
}
~~~



### 懒汉式

- 好处
  - 延迟对象的创建，用到的时候才创建，不浪费
- 坏处
  - 是线程不安全的

一个示例：

~~~java

/**
 * LAZY
 * 好处：延迟对象的创建，用到的时候才创建
 * 坏处：下面的写法是线程不安全的
 * 改进一下 https://zhuanlan.zhihu.com/p/52316864
 *
 * @Author: roohom
 */
public class Order {
    /**
     * 私有化类的构造器
     */
    private Order() {
    }
    
    /**
     * 声明类的对象 不初始化
     */
    private static Order orderInstance = null;

    /**
     * 声明public、static返回当前类的一个对象
     *
     * @return orderInstance
     */
    public static Order getOrderInstance() {

        //如果orderInstance为null，那说明是第一次调用，就直接new一个
        //线程不安全就体现在这里
        if (orderInstance == null) {
            orderInstance = new Order();
        }
        //如果不是第一次调用，说明之前new过了，那就直接返回之前new过的那个
        return orderInstance;
    }
}
~~~



### 一个案例

来看看java.lang的源码关于runtime的部分

~~~java

/**
 * Every Java application has a single instance of class
 * <code>Runtime</code> that allows the application to interface with
 * the environment in which the application is running. The current
 * runtime can be obtained from the <code>getRuntime</code> method.
 * <p>
 * An application cannot create its own instance of this class.
 *
 * @author  unascribed
 * @see     java.lang.Runtime#getRuntime()
 * @since   JDK1.0
 */

public class Runtime {
    private static Runtime currentRuntime = new Runtime();

    /**
     * Returns the runtime object associated with the current Java application.
     * Most of the methods of class <code>Runtime</code> are instance
     * methods and must be invoked with respect to the current runtime object.
     *
     * @return  the <code>Runtime</code> object associated with the current
     *          Java application.
     */
    public static Runtime getRuntime() {
        return currentRuntime;
    }

    /** Don't let anyone else instantiate this class */
    private Runtime() {}
}
~~~



# Continuing…

