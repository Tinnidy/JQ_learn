//教你从0开始封装一个插件
//避免污染全局变量
(function(){

  //1. 选择dom元素  $() / JQuery()
  function JQuery(selector){
    return new JQuery.prototype.init(selector);  //执行Jquery时，执行一个new操作，返回一个初始化函数实例
  }

  //3.原型上写一个初始化函数
  JQuery.prototype.init = function(selector){
    this.length = 0;

    if(!selector){   //对空元素进行校验
      return this;   //隐式创建的this对象；
    }
    //判断选中的是id还是class
    if(typeof selector === 'string' && selector.indexOf('.') != -1){
      var dom = document.getElementsByClassName(selector.slice(1));     //选中的class
    }else if(typeof(selector) === 'string' && selector.indexOf("#")!=-1){
      var dom = document.getElementById(selector.slice(1));     //选中的是id
    }else if(selector instanceof Element){
      var dom = selector;     //支持选中dom元素
    }

    //判断取得是class还是id（如果是id则只有一个长度，不是类数组）
    if(dom.length === undefined){
      this[0] = dom;
      this.length++;
    }else{
      for(let i =0; i<dom.length; i++){
        this[i] = dom[i];        //遍历类数组
        this.length++;
      }
    }
  }

  //4. 扩展Jquery的css方法
  JQuery.prototype.css = function(config){
    for(let i = 0; i<this.length; i++){    //循环遍历选中的元素
      for(let attr in config){
        this[i].style[attr] = config[attr];
      }
    }
    //方便链式调用
    return this;     //这里的this，指向的是选中的元素
  }

  //6. 实现get方法
  JQuery.prototype.get = function(num){
    if(num == null){
      //返回一个数组
      return Array.prototype.slice.call(this, 0);
    }else{
      //从前往后找
      if(num > 0){
        return this[num];
      }else{
        return this[num + this.length];
      }
    }
  }

  //7. 模拟eq方法  返回jquery对象  不传则返回空
  JQuery.prototype.eq = function(num){
    var dom = num != null? (num>0?this[num] :this[num+this.length]):nulll;
    this.pushStack(dom);
  }

  //8. add方法  该方法的preObject保存为之前选中的JQuery元素，将新的JQUery对象返回
  //将调用add方法前后选中的元素放入空对象，对空对象的prevObject设置为调用add方法之前的选中的jQuery元素
  JQuery.prototype.add = function(selector){
    var curObj = JQuery(selector);   //调用方法后选中的元素
    var baseObj = this;              //调用方法前选中的元素
    var newObj = JQuery();          //新建一个空对象
    for(let i =0; i<selector.length; i++){
      newObj[newObj.length++] = curObj[i];
    }
    for(let i = 0; i<baseObj.length; i++){
      newObj[new.length++] = baseObj[i];
    }
   this.pushStack(newObj);
   return newObj
  }

  //9. 将prevObject的赋值操作封装到方法中  使用入栈操作，让dom对象具有prevObject操作
  JQuery.prototype.pushStack = function(dom){
    //如果传的是原生的dom对象不是JQ对象
    if(dom.constructor != JQuery){
      dom = JQuery(dom);
    }
    //this指的是调用pushStrack操作的对象
    dom.prevObject = this;
    return dom;
  }

  //10.模拟jQuery的事件绑定自定义方法：参数1：事件名；参数2： 回调函数；使用trigger触发自定义方法
  //this指的是绑定该事件的元素，可以是单个，也可以是多个
  JQuery.prototype.myOn = function(name, cb){
    //给触发对象的每一个dom都绑定事件
    for(let i =0; i < this.length; i++){
      //先给每个dom元素定好一个cacheEvent属性并定义为空对象，将绑定的事件和回调函数添加进去
      if(!this[i].cacheEvent){    //避免重复廷加
        this[i].cacheEvent = {};
      }

      //当前事件对象没有这个事件属性
      if(!this[i].cacheEvent.has(name)){
        this[i].cacheEvent[name] = [cb];   //事件名、事件回调函数都用cacheEvent保存起来，回调函数使用数组保存，避免一个事件名下有多个回调函数
      }else{
        this[i].cacheEvent[name].push(cb);
      }
    }
  }

  //11. 自定义事件的trigger触发方法
  JQuery.prototype.myTrigger = function(name){
    //arguments是JS函数的实参列表，保存传入的实参。它是一个类数组，当传入的参数大于一个时，说明除了触发事件类型还传入了其它参数，我们用 [ ].slice.call() 方法将实参列表它转换为数组，并从第二位参数开始截取。
    var params = arguments.length >1? [].slice.call(arguments, 1):[];   //获取传入参数

    //遍历每个触发对象
    for(let i =0; i<this.length; i++){
      //如果触发事件存在，则触发函数
      if(this[i].cacheEvent[name]){
        this[i].cacheEvent[name].forEach(function(fn, index){
          //apply()将函数fn里面的this指向了当前触发myTrigger()的对象的this
          fn.apply(self, params);     //执行每个回调函数
        })
      }
    }
  }

  //12. 队列方法，queue()获取或设置当前匹配元素上待执行的函数队列，而使用dequeue() 方法则用于移除每个匹配元素的指定队列中的第一个函数，并执行被移除的函数
  JQuery.prototype.myQueue = function(type, handle){
    var queueName = arguments[0];    //队列中的方法名
    var addFunc = arguments[1];      //方法的回调函数
    var len = arguments.length;

    //获取队列操作（只传一个参数）
    if(len == 1){
      //此处可能有多个dom元素  只返回第一个元素上的队列函数
      return this[0][queueName];
    }

    //添加队列或往已有的队列中添加内容操作
    if(this[0][queueName] === undefined){
      this[0][queueName] = [addFunc];
    }else{
      this[0][queueName] = push(addFunc);
    }
  }

  //13. 出队方法
  JQuery.prototype.myDeQueue = function(name){
    //遍历元素,包装成JQuery对象
    for(var i = 0; i<this.length; i++){
      var self = JQuery(this[i]);
      var queueName = arguments[0];      //将所传的队列名保存起来
      var queueArr = self.myQueue(queueName);  //从dom元素上取出该队列的执行函数数组
      var currFunc = queueArr.shift();       //出栈队列函数中的第一个

      //如果队列中对应的内容为空则不执行任务号操作
      if(currFunc == undefined){
        return this;
      }

      //递归思想
      var next = function(){
        self.myDeQueue(queueName);    //下一个出队函数  闭包思想
      }

      //执行队列名对应数组内的第一个函数，并传入参数next等待下次调用
      currFunc(next); 
    }
    return this;
  }


  //jquery的end方法
  JQuery.prototype.end = function(){
    return this.prevObject;
  }


  //5.改变init的原型指向，指向JQuery的原型，css是定义在JQuery原型上的方法
  //因为选中的元素是init方法的实例，通过查找init的原型是无法找到css
  JQuery.prototype.init.prototype = JQuery.prototype;


  //2. 把局部变量暴露到全局window对象上，本质上是形成闭包
  window.$ = window.JQuery = JQuery;

}())


//3. 使用Jquery选中一个元素 返回的都是一个init函数实例  说明用到了new 操作符  我们可以在JQuery原型上写一个初始化函数