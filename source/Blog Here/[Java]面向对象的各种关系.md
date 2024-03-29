# [Java]OOP防脱发指南
> 整理于2020年7月21日


> 类、对象、抽象类、多态、接口

- 类可以被**继承(inherit)**(单一继承)
    - 就比如儿子有一个亲爹，而且只能是一个亲爹
- 类描述的是一类事物，是个笼统的概念，比如动物、水杯等等，是计算机编程中用于描述事物的一种思想
- 类的实例化就是对象，对象是类实例化的结果，一个类可以实例化多个对象
- 抽象类:对于一些描述不清楚功能的类被称为抽象类
- 接口就像拓展坞，就像干爹，解决了类只能单继承的问题

### 类(class)
- 概念:计算机编程中为了描述事物的一种思想，表述的是一类事物
    - 实际中的人类
- 类可以被继承
    - 继承只能是单继承，一个儿子只能有一个爹
    - 为了提高代码复用，儿子(继承者)就拥有了父亲(被继承者)的一些技能，比如儿子和父亲长得很像(继承者获得了被继承这的一些成员方法)
      
### 抽象类(abstract)
- 概念:描述一类事物却描述得不太清楚，就成就了抽象类。
- 举例说明:你家电瓶被偷了，晚上被偷的，恰巧被你当时目击了，可是离得远，看得不太清楚，让你描述也只是描述了大概，像周某，但是不能确定。
又比如，说动物这个类，所有的动物都要进食，可是他们进食的却都不一定一样，这就需要在定义动物这个类的时候，不能明确定义吃什么(**只给出方法体的声明，而不在方法体内写明功能**)        
所以抽象类是不能实例化的，因为一旦实例化必定是一个明确的对象
- 如果想要对抽象类进行实例化就得使用多态的方式

### 对象(object)
- 概念:对象是类实例化的结果，比如说水杯，描述太过笼统，不知道是哪一个水杯，又如说是人类，你不知道是哪一个人，可是经过实例化之后，我说周某，你就立即知道要保护好自己的电瓶。
- 比如上面说的人类，而在类中常常定义了一些方法(行为)，当类实例化成对象的时候，就可以有一些行为(方法)了
    - 比如人类实例化出一个“周某”这个对象，于是他就可以偷电瓶了(这其实是他后天的技能，应该属于接口，这里做比喻)


### 接口(interface)
- 概念:为了体现事物功能的扩展性，Java中就提供了接口来定义这些额外功能，并不给出具体实现。
- 举例说明:接口就像干爹，他解决了类不能多继承的问题。
    - 1.你定义一个类，如果不是因为继承，你的功能就被你定义死了，你想获得新功能，你就得继承(找一个爹)，但是继承只能单继承，万一你找的爹没有那个功能怎么办，你又得往上继承(找个爷爷)。
    - 2.比如你买个超薄本电脑，因为太薄了，预留的插口接很少，没法插网线，你就买了个拓展坞，于是你能插网线插USB设备等等，电脑上预留的插口(接口)提供给了你这种可能
    - 3.又比如，你想学习打篮球，你就去认了一个干爹，你让你干爹教你打球，就相当于给你增强了功能
    - 4.在这里所说的拓展坞和电脑上的插口就是接口，插上各种设备就是**实现(implements)**
    - 5.细说:为了给你的超薄本拥有插网线的功能，你买了个拓展坞，你定义一个Interface的时候就相当于把拓展坞插上了电脑，仅仅如此你还没法使用网络(你仅仅在接口里定义了抽象方法public abstract void xxx();)
    而当你在子类中(实现类中)将该抽象方法重写的时候，才真正将网线插上了拓展坞，当你调用的时候，就相当于你访问了网页并且可以正常访问
- 接口里只是写了功能/方法，而不区具体写明方法的内在实现，所以你在实现接口的时候就需要对接口内的方法进行**重写(override)**    
- 部分类的功能相同，部分类的功能不同，就可以把这些相同的功能抽取出来封装到接口

### 多态
- 多态就是同一种事物表现出来的多种形态
    - 举个栗子:我口渴了让你去给我买一瓶饮料，你到了小店发现饮料太多不知道哪种，于是你买回来一瓶农夫山泉，那么农夫山泉就是饮料呈现的一种形态
    - Java中的多态只有一种，是运行时的多态
