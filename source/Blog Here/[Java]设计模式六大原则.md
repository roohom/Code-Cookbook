# [Java]设计模式六大原则

> 本文由大量内容引用自：[去看原文](https://www.cnblogs.com/shijingjing07/p/6227728.html)

1）单一指责原则

2）里氏替换原则

3）依赖倒置原则

4）借口隔离原则

5）迪米特原则

6）开闭原则



## 单一职责原则

**每一个类只负责一个职责**

> 如果一个类负责两个不同的职责，当其中一个职责对应的需求改变时，由此对该职责的更改可能会影响另一个职责，从而导致该类的故障。

- 优点：
  - 降低了类的复杂度，一个类只负责一个职责
  - 提高了类的可读性、可维护性
  - <u>降低变更引起的风险</u>



## 里氏替换原则

**所有引用基类的地方必须能透明地使用其子类的对象**

> *由定义可知，在使用继承时，遵循里氏替换原则，**在子类中尽量不要重写和重载父类的方法**。*
> *继承包含这样一层含义：父类中凡是已经实现好的方法（相对抽象方法而言），实际上是在设定一系列的规范和契约，虽然它不强制要求所有的子类必须遵循这些契约，但是如果子类对这些非抽象方法任意修改，就会对整个继承体系造成破坏。而里氏替换原则就是表达了这一层含义。*
> *继承作为面向对象三大特性之一，在给程序设计带来巨大遍历的同时，也带来了弊端。比如使用继承会给程序带来侵入性，程序的可移植性降低，增加对象间的耦合性，如果一个类被其他的类所继承，则当这个类需要修改时，必须考虑到所有的子类，并且父类修改后，所有涉及到子类的功能都有可能产生故障。*



## 依赖倒置原则

- 高层模块不应该依赖于低层模块，二者都应该依赖于其抽象
- 抽象不应该依赖于细节，细节应该依赖于抽象

栗子🌰：

- 类A直接依赖类B，如果要将类A改为依赖类C，则必须通过修改类A的代码来达成。此时，类A一般是高层模块，负责复杂的业务逻辑，类B和类C是低层模块，负责基本的原子操作；修改A会给程序带来风险
- 将类A修改未依赖接口I，类B和类C各自实现接口I，类A通过接口I间接与类B或类C发生联系，则会大大降低修改类A的记几率

**依赖倒置原则基于这样一个事实：相对于细节的多变性，抽象的东西要稳定的多。**

**以抽象为基础搭建的架构比以细节为基础的架构要稳定的多。在java中，抽象指的是接口或抽象类，细节就是具体的实现类，使用接口或抽象类的目的是制定好规范，而不涉及任何具体的操作，把展现细节的任务交给他们的实现类去完成。依赖倒置的中心思想是面向接口编程。**

- 依赖关系的传递有三种
  - 接口传递
  - 构造方法传递
  - setter方法传递



## 接口隔离原则

- 客户端不应该依赖于它不需要的接口，一个类对另一个类的依赖应该建立在最小的接口上。



![classimpl](./SixRulesForJavaPattern.assets/classimpl.svg)

看一段代码(C++?)：

> 这里面有依赖关系传递中的**接口传递**

~~~java
interface I{
    void method1();
    void method2();
    void method3();
    void method4();
    void method5();
}
class A{
    public void depend1(I i){
        i.method1();
    }
    public void depend2(I i){
        i.method2();
    }
    public void depend3(I i){
        i.method3();
    }
}
class C{
    public void depend1(I i){
        i.method1();
    }
    public void depend2(I i){
        i.method4();
    }
    public void depend3(I i){
        i.method5();
    }
}
class B:I{
    public void method1(){
        Console.WriteLine("类B实现接口I的方法1");
    }
    public void method2(){
        Console.WriteLine("类B实现接口I的方法2");
    }
    public void method3(){
        Console.WriteLine("类B实现接口I的方法3");
    }
    public void method4(){}
    public void method5(){}
}
class D:I{
    public void method1(){
        Console.WriteLine("类B实现接口I的方法1");
    }
    public void method2(){}
    public void method3(){}
    public void method4(){
        Console.WriteLine("类B实现接口I的方法4");
    }
    public void method5(){
        Console.WriteLine("类B实现接口I的方法5");
    }
}
class Program
{
    static void Main(string[] args)
    {
        A a=new A();
        a.depend1(new B());
        a.depend2(new B());
        a.depend3(new B());
        
        C c=new C();
        c.depend1(new D());
        c.depend2(new D());
        c.depend3(new D());
        Console.ReadLine();
    }
}
~~~

类A依赖接口I中的方法1，方法2，方法3，类B是对类A依赖的实现；类C依赖接口I中的方法1，方法4，方法5，类D是对类C依赖的实现。对于类B和类D来说，虽然存在用不到的方法（红色标记所示），但由于实现了接口I，所以也必须要实现这些用不到的方法。



上面的接口I应该拆分为三个接口：

![classimpl2](./SixRulesForJavaPattern.assets/classimplrefract.svg)



~~~java
interface I{
    void method1();
    void method2();
    void method3();
    void method4();
    void method5();
}
class A{
    public void depend1(I i){
        i.method1();
    }
    public void depend2(I i){
        i.method2();
    }
    public void depend3(I i){
        i.method3();
    }
}
class C{
    public void depend1(I i){
        i.method1();
    }
    public void depend2(I i){
        i.method4();
    }
    public void depend3(I i){
        i.method5();
    }
}
class B:I{
    public void method1(){
        Console.WriteLine("类B实现接口I的方法1");
    }
    public void method2(){
        Console.WriteLine("类B实现接口I的方法2");
    }
    public void method3(){
        Console.WriteLine("类B实现接口I的方法3");
    }
    public void method4(){}
    public void method5(){}
}
class D:I{
    public void method1(){
        Console.WriteLine("类B实现接口I的方法1");
    }
    public void method2(){}
    public void method3(){}
    public void method4(){
        Console.WriteLine("类B实现接口I的方法4");
    }
    public void method5(){
        Console.WriteLine("类B实现接口I的方法5");
    }
}
class Program
{
    static void Main(string[] args)
    {
        A a=new A();
        a.depend1(new B());
        a.depend2(new B());
        a.depend3(new B());
        
        C c=new C();
        c.depend1(new D());
        c.depend2(new D());
        c.depend3(new D());
        Console.ReadLine();
    }
}
~~~

> 说到这里，可能会觉得接口隔离原则和之前的单一职责原则很相似，其实不然。
>
> 一，单一职责注重职责，而接口隔离原则注重对接口依赖的隔离；二，单一职责是约束类，其次是方法，针对的是程序中的实现和细节；而接口隔离原则约束的是接口，针对的是抽象，程序整体框架的构建。



## 迪米特法则

一个对象应该与其他对象保持最少的理解，类与类之间的关系越密切，耦合度就越大。

*对于被依赖的类不管多么复杂，都尽量将逻辑封装在类的内部。对外除了提供的public 方法，不对外泄露任何信息。*



## 开闭原则

**开闭原则是最基础的原则，最根本的原则**

一个软件实体如类，模块和函数应该对扩展开放，对修改关闭。用抽象构建框架，用实现扩展细节。
当软件需要变化时，尽量通过扩展软件实体的行为来实现变化，而不是通过修改已有的代码来实现变化。
当我们遵循前面介绍的5大原则，以及使用23种设计模式的目的就是遵循开闭原则。