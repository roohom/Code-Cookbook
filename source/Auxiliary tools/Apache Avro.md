# Apache Avro

> Avro是Hadoop的子项目，是高性能的数据传输中间件。Avro可以做到将数据进行序列化，适用于远程或本地大批量数据交互。在传输的过程中Avro对数据二进制序列化后节约数据存储空间和网络传输带宽。

## Why we choose Avro

- 优点：
  - 数据结构丰富
    - 8中基本类型
    - 6中复杂类型：**records**，enums, map, union等
  - 数据格式友好：json
  - 序列化数据传输和存储（字节类型）
    - 节省网络带宽，提高数据磁盘的读写性能
      - 为什么节省带宽？
        - 一部分是因为schema(约束)，一部分是数据体
      - 如何提高读写性能？
        - 数据是序列化数据

## 数据类型

### 原生类型

- null: 表示没有值

- boolean: 表示一个二进制布尔值

- int: 表示32位有符号整数

- long: 表示64位有符号整数

- float: 表示32位的单精度浮点数
- double: 表示64位双精度浮点数
- bytes: 表示8位的无符号字节序列
- string: Unicode 编码的字符序列

>  总共就这8种原生数据类型，这些原生数据类型均没有明确的属性。

### 复杂数据类型

> AVRO支持6种复杂类型，分别是：records, enums, arrays, maps, unions，fixed

#### Records

- 此数据结构内部字段可以由多种基本类型组成
- 必选属性
  - name：文件名
  - type：类型指定（records）
  - fields：具体字段，可以包含多个字段（此字段是一个数组）
    - 包含属性字段：
      - name：字段名
      - type：定义Schema的一个JSON对象，或者是命名一条记录定义的JSON string
- 非必选属性：
  - namespace：是一个JSON String命名空间，定义文件路径
  - doc：是一个JSON String，为使用这个Schema的用户提供文档
  - aliases: 是JSON的一个string数组，为这条记录提供别名

