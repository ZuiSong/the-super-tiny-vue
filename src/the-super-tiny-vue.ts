/**
 * the super tiny vue.js.
 * 代码总共200行左右(去掉注释)

 简介：一个迷你vue库，虽然小但功能全面，可以作为想了解vue背后思想以及想学习vue源码而又不知如何入手的入门学习资料。

 特性：
 * 数据响应式更新
 * 指令模板
 * MVVM
 * 轻量级

 ## 功能解读

 <templete>
 <div id='app'>
 <div>
 <input v-model='counter' />
 <button v-on-click='add'>add</button>
 <p v-text='counter'></p>
 </div>
 </div>
 </templete>

 <script>
 var vm = new Vue({
        id: 'counter',
        data: {
            counter: 1
        },
        methods: {
            add: function () {
                this.counter += 1;
            }
        }
    })
 </script>

 如上为一段模板以及js脚本，我们所要实现的目标就是将 vm 实例与id为app的DOM节点关联起来，当更改vm data 的counter属性的时候，
 input的值和p标签的文本会响应式的改变，method中的add方法则和button的click事件绑定。
 简单的说就是, 当点击button按钮的时候，触发button的点击事件回调函数add,在add方法中使counter加1，counter变化后模板中的input
 和p标签会自动更新。vm与模板之间是如何关联的则是通过 v-model、v-on-click、v-text这样的指令声明的。

 ### 实现思路详解

 * 查找含指令的节点
 * 对查找所得的节点进行指令解析、指令所对应的实现与节点绑定、 节点指令值所对应的data属性与前一步关联的指令实现绑定、data属性值通过setter通知关联的指令进行更新操作
 * 含指令的每一个节点单独执行第二步
 * 绑定操作完成后，初始化vm实例属性值

 #### 指令节点查找

 首先来看第一步，含指令节点的查找，因为指令声明是以属性的形式，所以可以通过属性选择器来进行查找，如下所示：

 `<input v-model='counter' type='text' />`
 则可通过 querySelectorAll('[v-model]') 查找即可。

 root = this.$el = document.getElementById(opts.el),
 els  = this.$els = root.querySelectorAll(getDirSelectors(Directives))
 root对于根节点，els对应于模板内含指令的节点。

 #### 指令解析，绑定

 * 1.指令解析
 同样以`<input v-model='counter' type='text' />`为例，解析即得到
 var directive = {
    name: 'v-model',
    value: 'counter'
 }
 name对应指令名，value对应指令值。

 * 2.指令对应实现与当前节点的绑定(bindDirective)
 指令实现可简单分为函数或是包含update函数的对象，如下便是`v-text`指令的实现代码：

 ```js
 text: function (el, value) {
        el.textContent = value || '';
    }
 ```
 指令与节点的绑定即将该函数与节点绑定起来，即该函数负责该节点的更新操作，`v-text`的功能是更新文本值，所以如上所示
 更改节点的textContent属性值。

 * 3. 响应式数据与节点的绑定(bindAccessors)
 响应式数据这里拆分为 data 和 methods 对象，分别用来存储数据值和方法。
 ```js
 var vm = new Vue({
        id: 'counter',
        data: {
            counter: 1
        },
        methods: {
            add: function () {
                this.counter += 1;
            }
        }
    })
 ```
 我们上面解析得到 v-model 对于的指令值为 counter,所以这里将data中的counter与当前节点绑定。

 通过2、3两步实现了类型与 textDirective->el<-data.counter 的关联，当data.counter发生set(具体查看defineProperty set 用法)操作时，
 data.counter得知自己被改变了，所以通知el元素需要进行更新操作，el则使用与其关联的指令(textDirective)对自身进行更新操作，从而实现了数据的
 响应式。

 * textDirective
 * el
 * data.counter
 这三个是绑定的主体，数据发生更改，通知节点需要更新，节点通过指令更新自己。

 * 4.其它相关操作
 */

const prefix = 'v'
/**
 * Directives
 */

const Directives: { [key: string]: Update | { update: Update } } = {
  /**
   * 对应于 v-text 指令
   */
  text: function (el: HTMLElement, value: any) {
    el.textContent = value || ''
  },
  show: function (el: HTMLElement, value: any) {
    el.style.display = value ? '' : 'none'
  },
  hidden: function (el: HTMLElement, value: any) {
    el.style.visibility = !value ? '' : 'hidden'
  },
  /**
   * 对应于 v-model 指令
   */
  model: function (
    el: HTMLInputElement & { handlers?: any },
    value: any,
    dirAgr: string,
    dir: Directive,
    vm: any,
    key: string | number | symbol
  ) {
    const eventName = 'keyup'
    el.value = value || ''

    /**
     * 事件绑定控制
     */
    if (el?.handlers?.[eventName]) {
      el.removeEventListener(eventName, el.handlers[eventName])
    } else {
      el.handlers = {}
    }

    el.handlers[eventName] = function (e) {
      vm[key] = e.target.value
    }

    el.addEventListener(eventName, el.handlers[eventName])
  },
  on: {
    update: function (
      el: HTMLElement & { handlers?: any },
      handler: Function,
      eventName: string,
      directive: Directive & { handlers?: {} },
      vm: any
    ): void {
      if (!directive.handlers) {
        directive.handlers = {}
      }

      const handlers = directive.handlers

      if (handlers[eventName]) {
        //绑定新的事件前移除原绑定的事件函数
        el.removeEventListener(eventName, handlers[eventName])
      }
      //绑定新的事件函数
      if (handler) {
        // 绑定this
        handler = handler.bind(vm)

        // @ts-ignore
        el.addEventListener(eventName, handler)
        handlers[eventName] = handler
      }
    },
  },
}

export interface TinyVueOption {
  ready?: Function
  methods: object
  data: object
  el: string
}

/**************************************************************
 * @privete
 * helper methods
 */

/**
 * 获取节点属性
 * 'v-text'='counter' => {name: v-text, value: 'counter'}
 */

export type AttrObj = {
  name: string
  value: string
}

function getAttributes(attributes: NamedNodeMap): AttrObj[] {
  return Array(attributes.length)
    .fill(0)
    .map((val, idx) => attributes[idx])
    .map(
      (attr) =>
        ({
          name: attr.name,
          value: attr.value,
        } as AttrObj)
    )
}

/**
 * 返回指令选择器，便于指令节点的查找
 */
function getDirSelectors(directives: object): string {
  /**
   * 支持的事件指令
   */
  const eventArr = ['click', 'change', 'blur']

  return (
    Object.keys(directives)
      .map((directive) => {
        /**
         * text => 'v-text'
         */
        return `[${prefix}-${directive}]`
      })
      .join() +
    ',' +
    eventArr.map((eventName) => `[${prefix}-on-${eventName}]`).join()
  )
}

export type Binding = {
  value: string
  directives: Directive[]
}

/**
 * get/set 绑定指令更新操作
 */
function bindAccessors(vm, key: PropertyKey, binding: Binding) {
  Object.defineProperty(vm, key, {
    get: function () {
      return binding.value
    },
    set: function (value) {
      binding.value = value
      binding.directives.forEach((directive) => {
        directive.update(
          directive.el,
          value,
          directive.argument,
          directive,
          vm,
          key
        )
      })
    },
  })
}

/**
 * 节点指令绑定
 */
function bindDirective(
  vm: Vm,
  el: HTMLElement,
  bindings: {},
  directive: Directive
): void {
  //从节点属性中移除指令声明
  el.removeAttribute(directive.attr.name)

  /**
   * v-text='counter'
   * v-model='counter'
   * data = {
            counter: 1
        }
   * 这里的 counter 即指令的 key
   */
  const key = directive.key
  let binding: Binding = bindings[key]

  if (!binding) {
    /**
     * value 即 counter 对应的值
     * directives 即 key 所绑定的相关指令
     如：
     bindings['counter'] = {
                value: 1,
                directives: [textDirective, modelDirective]
             }
     */
    binding = {
      value: '',
      directives: [],
    } as Binding
  }
  directive.el = el
  binding.directives.push(directive)

  //避免重复定义
  // eslint-disable-next-line no-prototype-builtins
  if (!vm.hasOwnProperty(key)) {
    /**
     * get/set 操作绑定
     */
    bindAccessors(vm, key, binding)
  }
  bindings[key] = binding
}

export type Update = (
  el: HTMLElement,
  val: any,
  argument: string,
  directive: Directive,
  vm: any,
  key: PropertyKey
) => void

export type Directive = {
  el?: HTMLElement
  argument: string
  update: Update
  definition: any
  attr: AttrObj
  dirname: string
  key: string
}

function parseDirective(attr: AttrObj): Directive {
  if (attr.name.indexOf(`${prefix}-`) === -1) return

  /**
   * 指令解析
   v-on-click='onClick'
   这里的指令名称为 'on', 'click'为指令的参数，onClick 为key
   */
  const directiveStr = attr.name.substr(prefix.length + 1)

  const argIndex = directiveStr.indexOf('-')

  const directiveName =
    argIndex === -1 ? directiveStr : directiveStr.substr(0, argIndex)

  const directiveDef = Directives[directiveName]
  if (!directiveDef) {
    return null
  }

  const arg = argIndex === -1 ? null : directiveStr.substr(argIndex + 1)

  /**
   * 指令表达式解析，即 v-text='counter' counter的解析
   * 这里暂时只考虑包含key的情况
   */
  const key = attr.value
  return {
    attr,
    key,
    dirname: directiveName,
    definition: directiveDef,
    argument: arg,
    /**
     * 指令本身是一个函数的情况下，更新函数即它本身，否则调用它的update方法
     */
    update:
      typeof directiveDef === 'function' ? directiveDef : directiveDef.update,
  } as Directive
}

export type Vm = TinyVue

/**
 * MiniVue
 */

export class TinyVue {
  private readonly $el: HTMLElement
  private readonly $els: NodeListOf<Element>
  private readonly _bindings: {}
  private readonly ready: Function

  constructor(opts: TinyVueOption) {
    // eslint-disable-next-line no-undef
    this.$el = document.getElementById(opts.el)
    // 获得指令选择器
    const directiveSelectors = getDirSelectors(Directives)
    this.$els = this.$el.querySelectorAll(directiveSelectors)
    this._bindings = {}
    this.$els.forEach((el) => this.processNode(el as HTMLElement))
    this.processNode(this.$el)

    /**
     * vm响应式数据初始化
     */
    for (const key in this._bindings) {
      const data = opts.data || {}
      // eslint-disable-next-line no-prototype-builtins
      if (data.hasOwnProperty(key)) {
        this[key] = data[key]
      }
      const methods = opts.methods || {}
      // eslint-disable-next-line no-prototype-builtins
      if (methods.hasOwnProperty(key)) {
        this[key] = methods[key].bind(this)
      }
    }

    /**
     * ready
     */
    if (typeof opts?.ready == 'function') {
      this.ready = opts.ready
      this.ready()
    }
  }

  private processNode(el: HTMLElement): void {
    getAttributes(el.attributes).forEach((attr) => {
      const directive: Directive = parseDirective(attr)
      if (directive) {
        bindDirective(this, el, this._bindings, directive)
      }
    })
  }
}

// @ts-ignore
// eslint-disable-next-line no-undef
window.TinyVue = TinyVue
