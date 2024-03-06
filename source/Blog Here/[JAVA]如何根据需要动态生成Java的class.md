# [JAVA]如何根据需要动态生成Java的class

## 需求描述

现在有一个将excel导入Hive表的需求，导入的大致思路是这样的:

1、使用Java程序将excel文本内容读入内存，使用一个Java bean去接收每一行数据

2、使用spark将java bean转成dataframe

3、将得到的dataframe注册成临时表，使用sql将数据写入hive目标表

由于excel的内容里列数量是不固定的，在第一步中，如果每次都新建一个新的对象去接收，程序的维护未免太复杂，且不具备动态的扩展性，一句话说就是不够优雅，我不允许这样的事情发生！

于是，为了解决这个问题，咨询了同事还有一个类库可以解决这个问题，它就是：

<h1>javaassist</h1>



## 操作起来！

既然内容是多变的，那么能不能根据实际excel的列数，动态去生成这个类，excel的表头列名就是对象的属性名，列有多少个，对象就有多少个属性！OK，下面邀请本次博客的重磅嘉宾：[javaassist](https://www.javassist.org/tutorial/tutorial.html#pool)



### 构建一个基础对象

maven中引入依赖：

~~~xml
<!-- https://mvnrepository.com/artifact/org.javassist/javassist -->
<dependency>
    <groupId>org.javassist</groupId>
    <artifactId>javassist</artifactId>
    <version>3.30.2-GA</version>
</dependency>
~~~



下面我们从0开始，构造一个简单的对象，对象包括：

- 无参构造
- 有参构造
- 两个属性
- setter和getter方法

~~~java
public class Person {
    private String name;
    private String sex;

    public void setName(String var1) {
        this.name = var1;
    }

    public String getName() {
        return this.name;
    }

    public void setSex(String var1) {
        this.sex = var1;
    }

    public String getSex() {
        return this.sex;
    }

    public Person(String var1, String var2) {
        this.sex = this.sex;
    }

    public Person() {
    }
}
~~~



### 声明类

~~~java
ClassPool classPool = ClassPool.getDefault();
CtClass row = classPool.makeClass("YOUR CLASS NAME");
row.setModifiers(Modifier.PUBLIC);
~~~

使用ClassPool创建了一个PUBLIC类方法，这时候主体已经有了

### 声明私有属性

两个私有属性，分别是name和sex

新建两个Field对象，根据官网，新建一个属性需要new一个CtField对象，此时需要传入属性的类型，但是，默认的只有booleanType、charType、byteType、shortType、intType、longType、floatType、doubleType和voidType，如果需要使用String类型，则需要用`CtClass cc = pool.get("java.lang.String");`来得到

~~~java
    /**
     * Creates a <code>CtField</code> object.
     * The created field must be added to a class
     * with <code>CtClass.addField()</code>.
     * An initial value of the field is specified
     * by a <code>CtField.Initializer</code> object.
     *
     * <p>If getter and setter methods are needed,
     * call <code>CtNewMethod.getter()</code> and 
     * <code>CtNewMethod.setter()</code>.
     *
     * @param type              field type
     * @param name              field name
     * @param declaring         the class to which the field will be added.
     *
     * @see CtClass#addField(CtField)
     * @see CtNewMethod#getter(String,CtField)
     * @see CtNewMethod#setter(String,CtField)
     * @see CtField.Initializer
     */
    public CtField(CtClass type, String name, CtClass declaring)
        throws CannotCompileException
    {
        this(Descriptor.of(type), name, declaring);
    }
~~~

先得到String的CtClass

~~~java
CtClass stringClass = stringClass = classPool.get("java.lang.String");
~~~

再构建属性：

~~~java
//参数依次是属性类型，属性名，累对象的CtClass
CtField a = new CtField(stringClass, colName, row);
a.setModifiers(Modifier.PRIVATE);
~~~

我们用得到类来添加该属性

~~~java
row.addField(a);
~~~

如此往复，再添加另一个属性即可



### 声明getter和setter

~~~java
//setter方法
//setter方法是没有返回值的，所以在此设置为voidType，为了规范命名，将属性名转为驼峰命名格式
//setter方法是有参数的，在此即为属性的类型，为string
CtMethod setMethod = new CtMethod(CtClass.voidType, "set" + Camel.camel(colName), new CtClass[]{stringClass}, row);
setMethod.setModifiers(Modifier.PUBLIC);
setMethod.setBody("this." + colName + "=$1;"); //这里的$1即代表第一个参数
//getter方法
//getter方法是有返回值的，返回值的类型即是属性的类型，在此为string类型，同样属性名转驼峰格式
//getter方法是无参的
CtMethod getMethod = new CtMethod(stringClass, "get" + Camel.camel(colName), new CtClass[]{}, row);
getMethod.setModifiers(Modifier.PUBLIC);
getMethod.setBody("return " + colName + ";");
~~~

在创造的类上添加这两个方法：

~~~java
row.addMethod(setMethod);
row.addMethod(getMethod);
~~~



### 创建构造方法

在此创建一个有两个参数的有参构造和一个无参构造

1、有参构造

~~~java
CtClass[] ctClasses = new CtClass[2];
Arrays.fill(ctClasses, stringClass);
CtConstructor constructor = new CtConstructor(ctClasses, row);
constructor.setModifiers(Modifier.PUBLIC);//有参构造方法是PUBLIC修饰的

constructor.setBody("this." + colName + "= " + colName + ";");
~~~

2、无参构造

~~~java
CtConstructor noArgConstructor = CtNewConstructor.make("public " + cName + "(){}", row);
row.addConstructor(noArgConstructor);
~~~



将以上方法整合起来就得到了一个构建的类，该类是可以在运行时调用的



## 封装

为了后续方便使用，将这些方法封装起来，做成工具使用，下面新建一个工具类，允许传入属性列表，并且默认全部都是string类型，如果需要其他类型，在此基础上修改即可：

~~~java
import com.svw.usually.util.Camel;
import javassist.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Arrays;

public class ClassMaker {

    private ArrayList<String> columns = new ArrayList<String>();
    private String className = null;

    public ClassMaker(ArrayList<String> columns, String className) {
        this.columns = columns;
        this.className = className;
    }

    private static final Logger LOG = LoggerFactory.getLogger(ClassMaker.class);

    public Class<?> makeClass() throws CannotCompileException {

        ClassPool classPool = ClassPool.getDefault();
        CtClass row = classPool.makeClass(className);
        row.setModifiers(Modifier.PUBLIC);

        CtClass stringClass = null;
        try {
            stringClass = classPool.get("java.lang.String");
        } catch (NotFoundException e) {
            throw new RuntimeException(e);
        }

        CtClass[] ctClasses = new CtClass[columns.size()];
        Arrays.fill(ctClasses, stringClass);
        CtConstructor constructor = new CtConstructor(ctClasses, row);
        constructor.setModifiers(Modifier.PUBLIC);
        for (String colName : columns) {
            LOG.info("Adding property name: {}", colName);
            CtField a = new CtField(stringClass, colName, row);
            a.setModifiers(Modifier.PRIVATE);
            row.addField(a);

            //set方法
            CtMethod setMethod = new CtMethod(CtClass.voidType, "set" + Camel.camel(colName), new CtClass[]{stringClass}, row);
            setMethod.setModifiers(Modifier.PUBLIC);
            setMethod.setBody("this." + colName + "=$1;");
            //get方法
            CtMethod getMethod = new CtMethod(stringClass, "get" + Camel.camel(colName), new CtClass[]{}, row);
            getMethod.setModifiers(Modifier.PUBLIC);
            getMethod.setBody("return " + colName + ";");

            row.addMethod(setMethod);
            row.addMethod(getMethod);
            constructor.setBody("this." + colName + "= " + colName + ";");
        }
        row.addConstructor(constructor);
        String[] pts = className.split(".");
        String cName = pts[pts.length - 1];
        CtConstructor noArgConstructor = CtNewConstructor.make("public " + cName + "(){}", row);
        row.addConstructor(noArgConstructor);
        
        return row.toClass();
    }
}
~~~

Camel

~~~java
public class Camel {
    public static String camel(String name) {
        if (name == null) {
            return null;
        }
        String head = name.substring(0, 1).toUpperCase();

        if (name.length() >= 2) {
            return head + name.substring(1, name.length());
        } else return head;
    }
}
~~~



## 后续

以上都只是最简单的用法，由于时间问题，先更新这些，如果后续还花更多时间探索或者解锁了其他玩法，再在这里更新！



