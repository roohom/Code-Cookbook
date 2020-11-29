# 集合

## 内部类
概念:在一个类中定义另一个类

- 两种内部类
    - 成员内部类
    书写的位置和成员变量、成员方法在同一个位置(方法外)
        ~~~java
        public class Person{
              //成员内部类
              public class InnerClass{
              
              }
        }
        ~~~
    
    - 局部内部类
        - 局部内部类
            - 书写在成员方法内
            - 不能使用访问修饰符
            
### 匿名内部类
匿名内部类:匿名对象+子类
- 匿名对象
    - Student stu = new Student();创建一个Student对象
        - 访问方法:stu.method()
    - 匿名对象格式:
        - 书写格式:new Student()
        - 访问内部成员方法 new Student().method()                
    - 作用:通常用于作实参传递
    
- 子类
    - ~~~java
      //父类
      abstract class Person{
          abstract void eat();
      }
      
      class Student exdents Person{
          public void eat(){
          }
      }
      ~~~
    
- 匿名内部类+子类
一个继承了类或者接口的子类对象
~~~java
new Student
{
    //重写方法
    public void eat(){
    }
} 
~~~
- 使用   
    - 1.当抽象类或接口中没有过多方法使用也比较少，可以考虑使用匿名内部类的方式  
    - 2.匿名内部类可以作为方法的实参进行传递
    
## 集合
- 概念:
    
    - 集合是用来存储多个同类型的数据的容器，它的长度是可以变化的
- 集合的体系结构  
    ~~~
        Collection接口:  
        |--- List接口:  
            |---ArrayListL类:  
            |---LinkedList类:  
        |--- Set接口:  
            |---Hash类:  
            |---TreeSet类:        
    ~~~
> 归属于Java.util

- Collection是一个接口，属于java集合体系中顶层的父接口，该接口下有两大体系:List、Set   
    - List特点:有序、可重复
    - Set特点:无序、唯一

- 使用方式
    - 属于接口，无法实例化，需要借助子类,通过多态的方式创建子类对象
    - collection coll = new ArrayList();
- 常用方法
    - 添加:public boolean add(Object obj);
    - 删除 public boolean remove(Object obj);
    - 修改 在遍历的过程中针对某个元素进行修改
    - 查询 需要借助迭代器进行遍历查询  
    - 获取元素个数 public int size();
    - 是否包含某个元素 public boolean contains(Object obj);
    - 清空所有元素 public void clear();
    - 判断是否为空 public boolean isEmpty();
> 集合内装的元素都经过了类型提升为Object(比如整形经过了自动装箱)    

### 泛型:约束的类型
常用于创建集合时使用，用来约束集合中可以存储的元素的类型

### 集合的遍历
- 集合没有类似数组一样的索引，无法利用索引进行遍历，需要借助迭代器
    - Iterator it = Collection.iterator();
    - 常用方法:
        - public boolean hasNext()	//判断迭代器中是否还有下一个元素.
        - public E next()			//获取迭代器中的下一个元素. 
        
    
- 集合遍历的大致过程
    - 1.创建集合对象.
    - 2.创建元素对象.
    - 3.把元素添加到集合中.
    - 4.遍历集合
        - 1.根据集合对象获取其对应的迭代器对象.
          通过Collection#iterator()方法实现.
        - 2.判断迭代器中是否有下一个元素.
          通过Iterator#hasNext()方法实现.
        - 3.如果有, 就获取该元素.
          通过Iterator#next()方法实现.
    - 案例:
    ~~~java
      //案例: 演示Collection集合存储自定义对象, 并遍历
      public class Demo {
          public static void main(String[] args) {
              //1. 创建集合对象.
              Collection<Student> coll = new ArrayList<>();
              //2. 创建元素对象.
              Student s1 = new Student("刘亦菲", 33);
              Student s2 = new Student("赵丽颖", 31);
              Student s3 = new Student("高圆圆", 35);
              //Student s4 = new Student("丹丹", 18);
              //3. 把元素对象添加到集合对象中.
              coll.add(s1);
              coll.add(s2);
              coll.add(s3);
              //coll.add(s4);
              //4. 遍历集合.
              //4.1 根据集合对象获取其对应的迭代器对象. Collection#iterator();
              Iterator<Student> it = coll.iterator();
              //4.2 判断迭代器中是否有下一个元素. Iterator#hasNext();
              while (it.hasNext()) {
                  //4.3 有就获取. Iterator#next();
                  Student stu = it.next();
                  System.out.println(stu);
      
                  //不能写成如下的形式, 因为next()方法调用一次, 就会获取一个值.
                  //下边这个代码就属于: 判断一次, 获取两个值.
                  //System.out.println(it.next().getName() + "..." + it.next().getAge());
              }
          }
    ~~~
    
### List集合
- 特点:
    - 1.存取元素有序。存储元素的顺序和取出元素的顺序一致
    - 2.list集合允许存储重复元素
    - 3.list集合中有索引，可以利用索引精确访问集合中的每一个元素
    
- 创建:
    - 没有构造方法
    - List是一个接口，无法实例化，需要借助子类
    - List list = new ArrayList();
    - List继承于Collection,父接口的相关功能，list集合也可以使用
    
- 常用方法(特有方法):
    - 添加 void add(int index, Object obj)
    - 修改 Object set(int index, Object obj) //指定索引位置上的元素修改为Obj，并返回修改之前的元素
    - 删除 
        - boolean remove(Object obj) 删除指定对象
        - Object remove(int index) 删除指定位置元素并返回旧元素
    - 查询 
        - Object get(int index) 查询到元素并返回
        - int indexOf(Object obj)
    
    - 遍历
        - iterator迭代器(见ListDemo4.java)
        - ListIterator迭代器(专有)
        - 四种方式:
            - 1.Iterator迭代器
                - 不适合遍历的同时增删
            - 2.ListIterator迭代器
            - 3.for循环
- 迭代器
    - 普通迭代器的弊端
        - 在迭代遍历时，如果向list集合中**添加**新元素或**删除**元素，迭代器会引发异常:ConcurrentModificationException
        - 解决办法:
            - 使用专用迭代器:ListIterator (ListIterator listIt = list.ListIterator())  
    - 增强for循环的底层是迭代器
#### AarrayList类
- 底层使用可变**数组**       
- 特点
    - 存取有序，有索引
    - 可以存储重复元素 
    - 查询和修改效率比较高
    - 添加和删除元素效率比较低
#### LinkedList类
- 底层使用**链表**
- 在创建LinkedList时所指定的索引，可以指定位置，但是在查询的时候用不上
- 特点
    - 存取有序
    - 可以存储重复元素
    - 可以存储null
    - 有角标，但是底层是链表结构用不上
    - 添加和删除元素效率高    
    - 查询较慢，修改元素值较慢
        - 链表特性:有头有尾
- 特有方法(针对链表的头和尾设计的):        
    - 添加:
        - addFirst(Object obj)
        - addLast(Object obj)
    - 删除
        - removeFirst()
        - removeLast()
    - 获取
        - getFirst()    
        - getLast()
        
            
## 增强For循环
增强for循环是用来遍历的，针数组和集合的遍历
- 弊端
    - 只能用来遍历
    - 增强for的底层其实是通过迭代器(Iterator)实现的

- 格式:
~~~java
int[] arr = {11,22,33,44,55};

for(元素类型 变量名 : array){
    //直接使用变量名就可以获取到array中的每一个元素
}

//集合
List list = new ArrayList();
for(元素类型 元素名: list){
    //打印
}
~~~
> 在循环过程中不能向集合中添加元素或者删除元素


## 集合的遍历
- 1.普通迭代器
    - iterator it = 集合对象.iterator()
- 2.专用迭代器
    - 只适用于List
    - ListIterator li = 集合对象.listIterator()
- 3.普通for循环
- 4.增强for循环

**如果要对集合元素进行删除修改应该使用for循环和专用迭代器**
        
        
## 数据结构
# 简单(常用)数据结构
- 栈
- 队列
- 数组(可变数组)
- 链表
## 栈
- 特点:FILO,先进后出

## 队列
- 特点:FIFO,先进先出

## 可变数组
创建新数组，将原数组中元素选择性拷贝到新数组中
- 特点
    - 有索引
    - 查询效率高

## 链表
内存中的存储节点，每个节点通过地址值链接在一起
- 特点
    - 查找元素时，从链表的头部开始遍历查找
    - 无索引
    - 查询效率低
    - 添加删除元素的效率高
- 单链表
- 双链表


## Set集合
- 特点
    - 存取无序，唯一
    - 不能存储重复元素
    - 是一个接口，无法实例化，需要借助子类
    - 无索引，不能通过for循环遍历
- 子类:HashSet和TreeSet
    - HashSet底层使用哈希表结构
        - 哈希表结构在存储元素时的过程
            - 1.拿出存储的元素，结合哈希算法，计算出元素的存储位置
                - 借助了HashCode()方法
            - 2.把存储的元素存放到计算出来的位置上
                - 判断在该位置上是否已经存在元素
                    - 没有:直接在该位置存储
                    - 有:比较两个元素是否相同(要存储的元素、已存在的元素)
                        - 相同:意味着元素一样，不用存储
                        - 不同:拉链法(拿计算出来的位置，再次结合哈希算法重新计算存储的位置)
    - TreeSet底层使用树结构
> 在使用HashSet集合存储自定义对象时，如果希望所存储的自定义对象属性的值不能重复时，需要对HashCode()和equals()方法进行重写
- 遍历
    - 迭代器
    - 增强for
    - toArray()

## 可变参数
定义不同的参数的方法，通过重载来实现，但是当参数的个数越来越多时，重载就不好使了，就需要使用可变参数
- 格式:
    - 修饰符 返回值类型 方法名(数值类型... 变量名)
- 要求    
    - 可变参数必须书写在方法参数声明的最后一个参数位置上    
    - 在方法参数声明时，只能存在一个可变参数(不考虑参数类型)
    - 当方法中需要传递其他参数时，需要将这些参数书写在可变参数之前
    
## Map集合
是一个接口，不能实例化，需要借助子类
- 特点
    - 底层使用了两个单列集合
    - 存储两个元素:一次存储一对元素(键值对)    
    - 存储的Key元素不能重复(底层使用使用Set集合来存储键)

~~~
|--HashMap类
|--TreeMap类
~~~

- 常用方法:
    - 添加:
        - public V put(Object key,Object value)
            - 一次性向集合中添加键值对这一对元素，并返回value
            - 底层实现:现在Map集合中通过key来判断是否存在的key元素
                - 有:就直接针对当前的key，来修改value(新的覆盖旧的)，返回旧的value
                - 没有，直接添加
            - 如果Map是空集合，第一次使用put方法，返回的是null，因此可以通过判断返回的是不是null来判断是不是第一次天剑
    - 修改:
        - public V put(Object key,Object value)
    - 删除:
        - public V remove(Object key) //根据指定的键删除集合中相应的一对元素，返回被删除的value
    - 查询:public V get(Object key) //根据指定的key元素，获取集合中匹配的value元素
    - 判断:
        - boolean containsKey(Object key)
        - boolean containsValue(Object value)
        - boolean isEmpty() 判断是否为空        
- 遍历
    - Map集合本身无法遍历，Map集合中没有迭代器
    - Map集合的遍历:
        - 1.使用存储Key元素的Set集合，实现遍历
            - 1.先获取到存储所有Key元素的Set集合
                - Map集合对象中的KeySet()方法
            - 2.遍历Set集合(迭代器，增强for)
            - 3.遍历过程中获取每一个key元素
            - 4.利用Map集合中的get(Object key),实现通过key获取value
        - 2.向Map集合中存储的一对键值对对象类型是:Map.Entry类型
            - 1.利用Map集合中的方法，获取集合中所有的Map.Entry    
            - 2.遍历所有的Map.Entry
            - 3.利用Map.Entry对象中的方法，分别获取:Key,Value
                - EntrySet()
                    - 获取所有的键值对对象集合(Set集合<Map.Entry>)    
                    
                    
## 小结
~~~
|---Collection集合(接口):单列集合的顶层父接口
    |---List集合(接口):存取有序、有索引、元素可重复
        |---ArrayList集合(类):底层使用数组，查询修改比较高快
            |--- 常用方法:add remove set get
        |---LinkList集合(类):底层使用链表，删除添加比较快
            |---常用方法:addFirst addLast removeFirst removeLast getFirst getLast
    |---Set集合(接口):存取无序，没有索引，元素唯一
        |---常用方法:全部来自于Collection
        |---HashSet集合(类):底层使用哈希表
        |---TreeSet集合(类):底层使用树(二叉树)结构
        |---LinkedHashSet(类):底层使用哈希表+链表结构。特点，有序存取
|---Map集合(接口):双列集合的顶层父接口
    |---常用方法:put remove get
        Set KeySet() 获取双列集合中用来存储所有的Key元素的单列集合
        Set<Map.Entry> entrySet
    |---HashMap集合(类):底层使用哈希表
    |---TreeMap集合(类):底层使用树结构


~~~
> 当拿捏不定时，选择List集合

