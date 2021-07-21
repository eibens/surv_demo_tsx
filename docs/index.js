const _state1 = new Map();
const _clearState = ()=>{
    _state1.clear();
};
const useState = (state1, id)=>{
    const s = {
        setState (state) {
            if (state !== null) _state1.set(id, state);
        },
        get state () {
            return _state1.get(id);
        }
    };
    if (!_state1.has(id)) _state1.set(id, state1);
    return [
        s.state,
        s.setState
    ];
};
const getState = (id)=>{
    return _state1.get(id);
};
const setState = (id, state)=>{
    return _state1.set(id, state);
};
const tick = typeof Promise == 'function' ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout;
const removeAllChildNodes = (parent)=>{
    while(parent.firstChild){
        parent.removeChild(parent.firstChild);
    }
};
const strToHash = (s)=>{
    let hash = 0;
    for(let i = 0; i < s.length; i++){
        const chr = s.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0;
    }
    return Math.abs(hash).toString(32);
};
const appendChildren = (element, children)=>{
    if (!Array.isArray(children)) {
        appendChildren(element, [
            children
        ]);
        return;
    }
    if (typeof children === 'object') children = Array.prototype.slice.call(children);
    children.forEach((child)=>{
        if (Array.isArray(child)) appendChildren(element, child);
        else {
            let c = _render(child);
            if (typeof c !== 'undefined') {
                if (Array.isArray(c)) appendChildren(element, c);
                else element.appendChild(c.nodeType == null ? document.createTextNode(c.toString()) : c);
            }
        }
    });
};
const SVG = (props)=>{
    const child = props.children[0];
    const attrs = child.attributes;
    const svg = hNS('svg');
    for(let i = attrs.length - 1; i >= 0; i--){
        svg.setAttribute(attrs[i].name, attrs[i].value);
    }
    svg.innerHTML = child.innerHTML;
    return svg;
};
const hydrate = (component, parent = null, removeChildNodes = true)=>{
    return render(component, parent, removeChildNodes);
};
const render = (component, parent = null, removeChildNodes = true)=>{
    let el = _render(component);
    if (Array.isArray(el)) {
        el = el.map((e)=>_render(e)
        );
        if (el.length === 1) el = el[0];
    }
    if (!!parent) {
        if (removeChildNodes) removeAllChildNodes(parent);
        if (el && parent.id && parent.id === el.id && parent.parentElement) {
            parent.parentElement.replaceChild(el, parent);
        } else {
            if (Array.isArray(el)) el.forEach((e)=>{
                appendChildren(parent, _render(e));
            });
            else appendChildren(parent, _render(el));
        }
        if (parent.ssr) return parent.ssr;
        return parent;
    } else {
        if (typeof isSSR === 'boolean' && isSSR === true && !Array.isArray(el)) return [
            el
        ];
        return el;
    }
};
const _render = (comp)=>{
    if (typeof comp === 'undefined') return [];
    if (comp == null) return [];
    if (typeof comp === 'string') return comp;
    if (typeof comp === 'number') return comp.toString();
    if (comp.tagName && comp.tagName.toLowerCase() === 'svg') return SVG({
        children: [
            comp
        ]
    });
    if (comp.tagName) return comp;
    if (comp && comp.component && comp.component.prototype && comp.component.prototype.constructor && /^class\s/.test(Function.prototype.toString.call(comp.component))) return renderClassComponent(comp);
    if (comp.component && typeof comp.component === 'function') return renderFunctionalComponent(comp);
    if (Array.isArray(comp)) return comp.map((c)=>_render(c)
    ).flat();
    if (typeof comp === 'function') return _render(comp());
    if (comp.component && comp.component.tagName && typeof comp.component.tagName === 'string') return _render(comp.component);
    if (Array.isArray(comp.component)) return _render(comp.component);
    if (comp.component) return _render(comp.component);
    if (typeof comp === 'object') return [];
    console.warn('Something unexpected happened with:', comp);
};
const renderFunctionalComponent = (fncComp)=>{
    const { component , props  } = fncComp;
    let el = component(props);
    return _render(el);
};
const renderClassComponent = (classComp)=>{
    const { component , props  } = classComp;
    const hash = strToHash(component.toString());
    component.prototype._getHash = ()=>hash
    ;
    const Component = new component(props);
    Component.willMount();
    let el = Component.render();
    el = _render(el);
    Component.elements = el;
    if (props && props.ref) props.ref(Component);
    if (typeof isSSR === 'undefined') tick(()=>{
        Component._didMount();
    });
    return el;
};
const renderComponent = (_component)=>{
    console.warn('DEPRECATED: renderComponent() is deprecated, use _render() instead!');
};
const hNS = (tag)=>document.createElementNS('http://www.w3.org/2000/svg', tag)
;
const h = (tagNameOrComponent, props, ...children)=>{
    if (typeof tagNameOrComponent !== 'string') return {
        component: tagNameOrComponent,
        props: {
            ...props,
            children: children
        }
    };
    let ref;
    const element = tagNameOrComponent === 'svg' ? hNS('svg') : document.createElement(tagNameOrComponent);
    const isEvent = (el, p)=>{
        if (0 !== p.indexOf('on')) return false;
        if (el.ssr) return true;
        return typeof el[p] === 'object' || typeof el[p] === 'function';
    };
    for(const p in props){
        if (p === 'style' && typeof props[p] === 'object') {
            const styles = Object.keys(props[p]).map((k)=>`${k}:${props[p][k]}`
            ).join(';').replace(/[A-Z]/g, (match)=>`-${match.toLowerCase()}`
            );
            props[p] = styles + ';';
        }
        if (p === 'ref') ref = props[p];
        else if (isEvent(element, p.toLowerCase())) element.addEventListener(p.toLowerCase().substring(2), (e)=>props[p](e)
        );
        else if (/className/i.test(p)) console.warn('You can use "class" instead of "className".');
        else element.setAttribute(p, props[p]);
    }
    appendChildren(element, children);
    if (ref) ref(element);
    if (element.ssr) return element.ssr;
    return element;
};
const detectSSR = ()=>{
    const isDeno = typeof Deno !== 'undefined';
    const hasWindow = typeof window !== 'undefined' ? true : false;
    return typeof isSSR !== 'undefined' && isSSR || isDeno || !hasWindow;
};
globalThis.isSSR = detectSSR() === true ? true : undefined;
globalThis._nano = {
    isSSR,
    location: {
        pathname: '/'
    }
};
const initSSR = (pathname = '/')=>{
    _nano.location = {
        pathname
    };
    globalThis.document = isSSR ? new DocumentSSR() : window.document;
};
const clearState = ()=>{
    _state1.clear();
};
const renderSSR = (component, options = {
})=>{
    const { pathname , clearState: clearState1 = true  } = options;
    initSSR(pathname);
    if (clearState1) _state1.clear();
    return render(component, null, true).join('');
};
class HTMLElementSSR {
    ssr;
    tagName;
    isSelfClosing = false;
    constructor(tag1){
        this.tagName = tag1;
        const selfClosing = [
            'area',
            'base',
            'br',
            'col',
            'embed',
            'hr',
            'img',
            'input',
            'link',
            'meta',
            'param',
            'source',
            'track',
            'wbr'
        ];
        if (selfClosing.indexOf(tag1) >= 0) {
            this.ssr = `<${tag1} />`;
            this.isSelfClosing = true;
        } else {
            this.ssr = `<${tag1}></${tag1}>`;
        }
    }
    get outerHTML() {
        return this.innerText;
    }
    get innerHTML() {
        const reg = /(^<[a-z]+>)([\s\S]*)(<\/[a-z]+>$)/gm;
        return reg.exec(this.ssr)?.[2] ?? '';
    }
    get innerText() {
        const reg = /(^<[^>]+>)(.+)?(<\/[a-z]+>$|\/>$)/gm;
        return reg.exec(this.ssr)?.[2] ?? '';
    }
    set innerText(text) {
        const reg = /(^<[^>]+>)(.+)?(<\/[a-z]+>$|\/>$)/gm;
        this.ssr = this.ssr.replace(reg, `$1${text}$3`);
    }
    get attributes() {
        return {
            length: 1
        };
    }
    setAttributeNS(name, value) {
        this.setAttribute(name, value);
    }
    setAttribute(name, value) {
        if (this.isSelfClosing) this.ssr = this.ssr.replace(/(^<[a-z]+ )(.+)/gm, `$1${name}="${value}" $2`);
        else this.ssr = this.ssr.replace(/(^<[^>]+)(.+)/gm, `$1 ${name}="${value}"$2`);
    }
    appendChild(child) {
        const append = child.ssr ? child.ssr : child;
        const index = this.ssr.lastIndexOf('</');
        this.ssr = this.ssr.substring(0, index) + append + this.ssr.substring(index);
    }
    replaceChild(newChild, _oldChild) {
        this.innerText = newChild.ssr;
    }
    get children() {
        const reg = /<([a-z]+)((?!<\/\1).)*<\/\1>/gms;
        const array = [];
        let match;
        while((match = reg.exec(this.innerHTML)) !== null){
            array.push(match[0].replace(/[\s]+/gm, ' '));
        }
        return array;
    }
    addEventListener(_type, _listener, _options) {
    }
}
class DocumentSSR {
    body;
    head;
    constructor(){
        this.body = this.createElement('body');
        this.head = this.createElement('head');
    }
    createElement(tag) {
        return new HTMLElementSSR(tag);
    }
    createElementNS(_URI, tag) {
        return new HTMLElementSSR(tag);
    }
    createTextNode(text) {
        return text;
    }
    querySelector(_query) {
        return undefined;
    }
}
const VERSION = '0.0.18';
const task = (task1)=>setTimeout(task1, 0)
;
const nodeToString = (node)=>{
    const tmpNode = document.createElement('div');
    tmpNode.appendChild(node.cloneNode(true));
    return tmpNode.innerHTML;
};
const isDescendant = (desc, root)=>{
    return !!desc && (desc === root || isDescendant(desc.parentNode, root));
};
const onNodeRemove = (element, callback)=>{
    let observer = new MutationObserver((mutationsList)=>{
        mutationsList.forEach((mutation)=>{
            mutation.removedNodes.forEach((removed)=>{
                if (isDescendant(element, removed)) {
                    callback();
                    if (observer) {
                        observer.disconnect();
                        observer = undefined;
                    }
                }
            });
        });
    });
    observer.observe(document, {
        childList: true,
        subtree: true
    });
    return observer;
};
const printVersion = ()=>{
    const info = `Powered by nano JSX v${VERSION}`;
    console.log(`%c %c %c %c %c ${info} %c http://nanojsx.io`, 'background: #ff0000', 'background: #ffff00', 'background: #00ff00', 'background: #00ffff', 'color: #fff; background: #000000;', 'background: none');
};
class Component {
    props;
    id;
    _elements = [];
    _skipUnmount = false;
    _hasUnmounted = false;
    constructor(props){
        this.props = props || {
        };
        this.id = this._getHash();
    }
    setState(state, shouldUpdate = false) {
        const isObject = typeof state === 'object' && state !== null;
        if (isObject && this.state !== undefined) this.state = {
            ...this.state,
            ...state
        };
        else this.state = state;
        if (shouldUpdate) this.update();
    }
    set state(state) {
        _state1.set(this.id, state);
    }
    get state() {
        return _state1.get(this.id);
    }
    set initState(state) {
        if (this.state === undefined) this.state = state;
    }
    get elements() {
        return this._elements;
    }
    set elements(elements) {
        if (!Array.isArray(elements)) elements = [
            elements
        ];
        elements.forEach((element)=>{
            this._elements.push(element);
        });
    }
    _addNodeRemoveListener() {
        if (/^[^{]+{\s+}$/gm.test(this.didUnmount.toString())) return;
        onNodeRemove(this.elements[0], ()=>{
            if (!this._skipUnmount) this._didUnmount();
        });
    }
    _didMount() {
        this._addNodeRemoveListener();
        this.didMount();
    }
    _didUnmount() {
        if (this._hasUnmounted) return;
        this.didUnmount();
        this._hasUnmounted = true;
    }
    willMount() {
    }
    didMount() {
    }
    didUnmount() {
    }
    render(_update) {
    }
    update(update) {
        this._skipUnmount = true;
        const oldElements = [
            ...this.elements
        ];
        this._elements = [];
        let el = this.render(update);
        el = _render(el);
        this.elements = el;
        const parent = oldElements[0].parentElement;
        if (!parent) console.warn('Component needs a parent element to get updated!');
        this.elements.forEach((child)=>{
            parent.insertBefore(child, oldElements[0]);
        });
        oldElements.forEach((child)=>{
            child.remove();
            child = null;
        });
        this._addNodeRemoveListener();
        tick(()=>{
            this._skipUnmount = false;
            if (!this.elements[0].isConnected) this._didUnmount();
        });
    }
    _getHash() {
    }
}
class Helmet extends Component {
    static SSR(body) {
        const reg = /(<helmet\b[^>]*>)((.|\n)*?)(<\/helmet>)/gm;
        const head = [];
        const footer = [];
        if (typeof document !== 'undefined' && document.head) {
            let children = [];
            children = document.head.children;
            for(let i = 0; i < children.length; i++){
                if (head.indexOf(children[i]) === -1) {
                    head.push(children[i]);
                }
            }
        }
        let result;
        while((result = reg.exec(body)) !== null){
            const first = result[1];
            const second = result[2];
            const toHead = first.includes('data-placement="head"');
            if (toHead && !head.includes(second)) head.push(second);
            else if (!footer.includes(second)) footer.push(second);
        }
        const cleanBody = body.replace(reg, '');
        return {
            body: cleanBody,
            head,
            footer
        };
    }
    didMount() {
        this.props.children.forEach((element)=>{
            const parent = this.props.footer ? document.body : document.head;
            const tag2 = element.tagName;
            let attrs = [];
            attrs.push(element.innerText);
            for(let attr = 0; attr < element.attributes.length; attr++){
                attrs.push(element.attributes.item(attr)?.name.toLowerCase());
                attrs.push(element.attributes.item(attr)?.value.toLowerCase());
            }
            if (tag2 === 'HTML' || tag2 === 'BODY') {
                const htmlTag = document.getElementsByTagName(tag2)[0];
                for(let attr1 = 1; attr1 < attrs.length; attr1 += 2){
                    htmlTag.setAttribute(attrs[attr1], attrs[attr1 + 1]);
                }
                return;
            } else if (tag2 === 'TITLE') {
                const titleTags = document.getElementsByTagName('TITLE');
                if (titleTags.length > 0) {
                    const e = element;
                    titleTags[0].text = e.text;
                } else {
                    const titleTag = h('title', null, element.innerHTML);
                    parent.appendChild(titleTag);
                }
                return;
            }
            let exists = false;
            attrs = attrs.sort();
            const el = document.getElementsByTagName(tag2);
            for(let i = 0; i < el.length; i++){
                let attrs2 = [];
                attrs2.push(el[i].innerText);
                for(let attr1 = 0; attr1 < el[i].attributes.length; attr1++){
                    attrs2.push(el[i].attributes.item(attr1)?.name.toLowerCase());
                    attrs2.push(el[i].attributes.item(attr1)?.value.toLowerCase());
                }
                attrs2 = attrs2.sort();
                if (attrs.length > 0 && attrs2.length > 0 && JSON.stringify(attrs) === JSON.stringify(attrs2)) exists = true;
            }
            if (!exists) appendChildren(parent, element);
        });
    }
    render() {
        const placement = this.props.footer ? 'footer' : 'head';
        const ssr = globalThis && globalThis.isSSR ? true : false;
        if (ssr) return h('helmet', {
            'data-ssr': true,
            'data-placement': placement
        }, this.props.children);
        else return [];
    }
}
class Img extends Component {
    constructor(props1){
        super(props1);
        const { src , key  } = props1;
        this.id = `${strToHash(src)}-${strToHash(JSON.stringify(props1))}`;
        if (key) this.id += `key-${key}`;
        if (!this.state) this.setState({
            isLoaded: false,
            image: undefined
        });
    }
    didMount() {
        const { lazy =true , placeholder , children , key: key1 , ref , ...rest } = this.props;
        if (typeof lazy === 'boolean' && lazy === false) return;
        const observer = new IntersectionObserver((entries, observer1)=>{
            entries.forEach((entry)=>{
                if (entry.isIntersecting) {
                    observer1.disconnect();
                    this.state.image = h('img', {
                        ...rest
                    });
                    if (this.state.image.complete) {
                        this.state.isLoaded = true;
                        this.update();
                    } else {
                        this.state.image.onload = ()=>{
                            this.state.isLoaded = true;
                            this.update();
                        };
                    }
                }
            });
        }, {
            threshold: [
                0,
                1
            ]
        });
        observer.observe(this.elements[0]);
    }
    render() {
        const { src: src1 , placeholder , children , lazy =true , key: key1 , ref , ...rest } = this.props;
        if (typeof lazy === 'boolean' && lazy === false) {
            this.state.image = h('img', {
                src: src1,
                ...rest
            });
            return this.state.image;
        }
        if (this.state.isLoaded) {
            return this.state.image;
        } else if (placeholder && typeof placeholder === 'string') {
            return h('img', {
                src: placeholder,
                ...rest
            });
        } else if (placeholder && typeof placeholder === 'function') {
            return placeholder();
        } else {
            const style = {
            };
            if (rest.width) style.width = `${rest.width}px`;
            if (rest.height) style.height = `${rest.height}px`;
            const { width , height , ...others } = rest;
            return h('div', {
                style,
                ...others
            });
        }
    }
}
const Fragment = (props2)=>{
    return props2.children;
};
class Link extends Component {
    prefetchOnHover() {
        this.elements[0].addEventListener('mouseover', ()=>this.addPrefetch()
        , {
            once: true
        });
    }
    prefetchOnVisible() {
        const observer = new IntersectionObserver((entries, observer1)=>{
            entries.forEach((entry)=>{
                if (entry.isIntersecting) {
                    observer1.disconnect();
                    this.addPrefetch();
                }
            });
        }, {
            threshold: [
                0,
                1
            ]
        });
        observer.observe(this.elements[0]);
    }
    addPrefetch() {
        let doesAlreadyExist = false;
        const links = document.getElementsByTagName('link');
        for(let i = 0; i < links.length; i++){
            if (links[i].getAttribute('rel') === 'prefetch' && links[i].getAttribute('href') === this.props.href) {
                doesAlreadyExist = true;
            }
        }
        if (!doesAlreadyExist) {
            const prefetch = h('link', {
                rel: 'prefetch',
                href: this.props.href,
                as: 'document'
            });
            document.head.appendChild(prefetch);
        }
    }
    didMount() {
        const { href , prefetch , delay =0 , back =false  } = this.props;
        if (back) this.elements[0].addEventListener('click', (e)=>{
            e.preventDefault();
            const target = e.target;
            if (target.href === document.referrer) window.history.back();
            else window.location.href = target.href;
        });
        if (delay > 0) this.elements[0].addEventListener('click', (e)=>{
            e.preventDefault();
            setTimeout(()=>window.location.href = href
            , delay);
        });
        if (prefetch) {
            if (prefetch === 'hover') this.prefetchOnHover();
            else if (prefetch === 'visible') this.prefetchOnVisible();
            else this.addPrefetch();
        }
    }
    render() {
        const { children , prefetch , back , ref , ...rest } = this.props;
        if (!this.props.href) console.warn('Please add "href" to <Link>');
        if (children.length !== 1) console.warn('Please add ONE child to <Link> (<Link>child</Link>)');
        const a = h('a', {
            ...rest
        }, ...children);
        if (prefetch === true && !(typeof window !== 'undefined' && window.document)) {
            const link = h('link', {
                rel: 'prefetch',
                href: this.props.href,
                as: 'document'
            });
            const helmet = h(Helmet, null, link);
            return h(Fragment, null, [
                helmet,
                a
            ]);
        } else {
            return a;
        }
    }
}
const instances = [];
const register = (comp)=>instances.push(comp)
;
const unregister = (comp)=>instances.splice(instances.indexOf(comp), 1)
;
const historyPush = (path)=>{
    window.history.pushState({
    }, '', path);
    instances.forEach((instance)=>instance.handlePop()
    );
};
const historyReplace = (path)=>{
    window.history.replaceState({
    }, '', path);
    instances.forEach((instance)=>instance.handlePop()
    );
};
const matchPath = (pathname, options)=>{
    const { exact =false , regex  } = options;
    let { path  } = options;
    if (!path) {
        return {
            path: null,
            url: pathname,
            isExact: true
        };
    }
    let match;
    let params = {
    };
    if (path.includes('/:')) {
        const pathArr = path.split('/');
        const pathnameArr = pathname.split('/');
        pathArr.forEach((p, i)=>{
            if (/^:/.test(p)) {
                const key1 = p.slice(1);
                const value = pathnameArr[i];
                if (regex && regex[key1]) {
                    const regexMatch = regex[key1].test(value);
                    if (!regexMatch) return null;
                }
                params = {
                    ...params,
                    [key1]: value
                };
                pathArr[i] = pathnameArr[i];
            }
        });
        path = pathArr.join('/');
    }
    if (path === '*') match = [
        pathname
    ];
    if (!match) match = new RegExp(`^${path}`).exec(pathname);
    if (!match) return null;
    const url = match[0];
    const isExact = pathname === url;
    if (exact && !isExact) return null;
    return {
        path,
        url,
        isExact,
        params
    };
};
class Switch extends Component {
    index = 0;
    path = '';
    match = {
        index: -1,
        path: ''
    };
    didMount() {
        window.addEventListener('popstate', this.handlePop.bind(this));
        register(this);
    }
    didUnmount() {
        window.removeEventListener('popstate', this.handlePop.bind(this));
        unregister(this);
    }
    handlePop() {
        this.findChild();
        if (this.shouldUpdate()) this.update();
    }
    findChild() {
        this.match = {
            index: -1,
            path: ''
        };
        for(let i = 0; i < this.props.children.length; i++){
            const child = this.props.children[i];
            const { path , exact , regex  } = child.props;
            const match = matchPath(typeof isSSR !== 'undefined' ? _nano.location.pathname : window.location.pathname, {
                path,
                exact,
                regex
            });
            if (match) {
                this.match.index = i;
                this.match.path = path;
                return;
            }
        }
    }
    shouldUpdate() {
        return this.path !== this.match.path || this.index !== this.match.index;
    }
    render() {
        this.findChild();
        const child = this.props.children[this.match.index];
        if (this.match.index === -1) {
            this.path = "";
            this.index = 0;
        }
        if (child) {
            const { path  } = child.props;
            this.path = path;
            this.index = this.match.index;
            const el = _render(child);
            return _render(el);
        } else if (this.props.fallback) {
            return _render(this.props.fallback);
        } else {
            return h('div', {
                class: 'route'
            }, 'not found');
        }
    }
}
const Route = ({ path , regex , children  })=>{
    children.forEach((child)=>{
        if (child.props) child.props = {
            ...child.props,
            route: {
                path,
                regex
            }
        };
    });
    return children;
};
const to = (to1, replace = false)=>{
    replace ? historyReplace(to1) : historyPush(to1);
};
const Link1 = ({ to: to1 , replace , children  })=>{
    const handleClick = (event)=>{
        event.preventDefault();
        replace ? historyReplace(to1) : historyPush(to1);
    };
    return h('a', {
        href: to1,
        onClick: (e)=>handleClick(e)
    }, children);
};
const mod = function() {
    return {
        Switch: Switch,
        Route: Route,
        to: to,
        Link: Link1
    };
}();
class Suspense extends Component {
    ready = false;
    constructor(props2){
        super(props2);
        const { children , fallback , cache: cache1 = false , ...rest1 } = this.props;
        const str = JSON.stringify(rest1, function(_key, val) {
            if (typeof val === 'function') return `${val}`;
            return val;
        });
        this.id = strToHash(JSON.stringify(str));
    }
    async didMount() {
        const { children: children1 , fallback: fallback1 , cache: cache1 = false , ...rest1 } = this.props;
        if (cache1) this.initState = {
        };
        if (this.loadFromCache(cache1)) return;
        const promises = Object.values(rest1).map((p)=>p()
        );
        const resolved = await Promise.all(promises);
        const data = this.prepareData(rest1, resolved, cache1);
        this.addDataToChildren(data);
        this.ready = true;
        this.update();
    }
    ssr() {
        const { children: children1 , fallback: fallback1 , cache: cache1 = false , ...rest1 } = this.props;
        const functions = Object.values(rest1).map((p)=>p()
        );
        const data = this.prepareData(rest1, functions, false);
        this.addDataToChildren(data);
    }
    loadFromCache(cache) {
        const hasCachedProps = this.state && cache && Object.keys(this.state).length > 0;
        if (hasCachedProps) {
            this.addDataToChildren(this.state);
            this.ready = true;
        }
        return hasCachedProps;
    }
    prepareData(rest, fnc, cache) {
        const data = Object.keys(rest).reduce((obj, item, index)=>{
            if (cache) this.state = {
                ...this.state,
                [item]: fnc[index]
            };
            return {
                ...obj,
                [item]: fnc[index]
            };
        }, {
        });
        return data;
    }
    addDataToChildren(data) {
        this.props.children.forEach((child)=>{
            if (child.props) child.props = {
                ...child.props,
                ...data
            };
        });
    }
    render() {
        if (typeof isSSR === 'undefined') {
            const { cache: cache2 = false  } = this.props;
            this.loadFromCache(cache2);
            return !this.ready ? this.props.fallback : this.props.children;
        } else {
            this.ssr();
            return this.props.children;
        }
    }
}
class Visible extends Component {
    isVisible = false;
    didMount() {
        const observer = new IntersectionObserver((entries, observer1)=>{
            entries.forEach((entry)=>{
                if (entry.isIntersecting) {
                    observer1.disconnect();
                    this.isVisible = true;
                    this.update();
                }
            });
        }, {
            threshold: [
                0,
                1
            ]
        });
        observer.observe(this.elements[0]);
    }
    render() {
        if (!this.isVisible) {
            return h('div', {
                'data-visible': false,
                visibility: 'hidden'
            });
        } else {
            if (this.props.onVisible) this.props.onVisible();
            return render(this.props.component || this.props.children[0]);
        }
    }
}
const MODE_SLASH = 0;
const MODE_TEXT = 1;
const MODE_WHITESPACE = 2;
const MODE_TAGNAME = 3;
const MODE_COMMENT = 4;
const MODE_PROP_SET = 5;
const MODE_PROP_APPEND = 6;
const CHILD_APPEND = 0;
const treeify = (built, fields)=>{
    const _treeify = (built1)=>{
        let tag2 = '';
        let currentProps = null;
        const props3 = [];
        const children1 = [];
        for(let i = 1; i < built1.length; i++){
            const type = built1[i++];
            const value = built1[i] ? fields[built1[i++] - 1] : built1[++i];
            if (type === 3) {
                tag2 = value;
            } else if (type === 4) {
                props3.push(value);
                currentProps = null;
            } else if (type === 5) {
                if (!currentProps) {
                    currentProps = Object.create(null);
                    props3.push(currentProps);
                }
                currentProps[built1[++i]] = [
                    value
                ];
            } else if (type === 6) {
                currentProps[built1[++i]].push(value);
            } else if (type === 2) {
                children1.push(_treeify(value));
            } else if (type === 0) {
                children1.push(value);
            }
        }
        return {
            tag: tag2,
            props: props3,
            children: children1
        };
    };
    const { children: children1  } = _treeify(built);
    return children1.length > 1 ? children1 : children1[0];
};
const evaluate = (h1, built, fields, args)=>{
    let tmp;
    built[0] = 0;
    for(let i = 1; i < built.length; i++){
        const type = built[i++];
        const value = built[i] ? (built[0] |= type ? 1 : 2, fields[built[i++]]) : built[++i];
        if (type === 3) {
            args[0] = value;
        } else if (type === 4) {
            args[1] = Object.assign(args[1] || {
            }, value);
        } else if (type === 5) {
            (args[1] = args[1] || {
            })[built[++i]] = value;
        } else if (type === 6) {
            args[1][built[++i]] += `${value}`;
        } else if (type) {
            tmp = h1.apply(value, evaluate(h1, value, fields, [
                '',
                null
            ]));
            args.push(tmp);
            if (value[0]) {
                built[0] |= 2;
            } else {
                built[i - 2] = CHILD_APPEND;
                built[i] = tmp;
            }
        } else {
            args.push(value);
        }
    }
    return args;
};
const build = function(statics, ...rest2) {
    const fields = [
        statics,
        ...rest2
    ];
    const h1 = this;
    let mode = 1;
    let buffer = '';
    let quote = '';
    let current = [
        0
    ];
    let __char;
    let propName;
    const commit = (field)=>{
        if (mode === 1 && (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g, '')))) {
            if (false) {
                current.push(field ? fields[field] : buffer);
            } else {
                current.push(0, field, buffer);
            }
        } else if (mode === 3 && (field || buffer)) {
            if (false) {
                current[1] = field ? fields[field] : buffer;
            } else {
                current.push(3, field, buffer);
            }
            mode = MODE_WHITESPACE;
        } else if (mode === 2 && buffer === '...' && field) {
            if (false) {
                current[2] = Object.assign(current[2] || {
                }, fields[field]);
            } else {
                current.push(4, field, 0);
            }
        } else if (mode === 2 && buffer && !field) {
            if (false) {
                (current[2] = current[2] || {
                })[buffer] = true;
            } else {
                current.push(5, 0, true, buffer);
            }
        } else if (mode >= 5) {
            if (false) {
                if (mode === 5) {
                    (current[2] = current[2] || {
                    })[propName] = field ? buffer ? buffer + fields[field] : fields[field] : buffer;
                    mode = MODE_PROP_APPEND;
                } else if (field || buffer) {
                    current[2][propName] += field ? buffer + fields[field] : buffer;
                }
            } else {
                if (buffer || !field && mode === 5) {
                    current.push(mode, 0, buffer, propName);
                    mode = MODE_PROP_APPEND;
                }
                if (field) {
                    current.push(mode, field, 0, propName);
                    mode = MODE_PROP_APPEND;
                }
            }
        }
        buffer = '';
    };
    for(let i = 0; i < statics.length; i++){
        if (i) {
            if (mode === 1) {
                commit();
            }
            commit(i);
        }
        for(let j = 0; j < statics[i].length; j++){
            __char = statics[i][j];
            if (mode === 1) {
                if (__char === '<') {
                    commit();
                    if (false) {
                        current = [
                            current,
                            '',
                            null
                        ];
                    } else {
                        current = [
                            current
                        ];
                    }
                    mode = MODE_TAGNAME;
                } else {
                    buffer += __char;
                }
            } else if (mode === 4) {
                if (buffer === '--' && __char === '>') {
                    mode = MODE_TEXT;
                    buffer = '';
                } else {
                    buffer = __char + buffer[0];
                }
            } else if (quote) {
                if (__char === quote) {
                    quote = '';
                } else {
                    buffer += __char;
                }
            } else if (__char === '"' || __char === "'") {
                quote = __char;
            } else if (__char === '>') {
                commit();
                mode = MODE_TEXT;
            } else if (!mode) {
            } else if (__char === '=') {
                mode = MODE_PROP_SET;
                propName = buffer;
                buffer = '';
            } else if (__char === '/' && (mode < 5 || statics[i][j + 1] === '>')) {
                commit();
                if (mode === 3) {
                    current = current[0];
                }
                mode = current;
                if (false) {
                    (current = current[0]).push(h1(...mode.slice(1)));
                } else {
                    (current = current[0]).push(2, 0, mode);
                }
                mode = MODE_SLASH;
            } else if (__char === ' ' || __char === '\t' || __char === '\n' || __char === '\r') {
                commit();
                mode = MODE_WHITESPACE;
            } else {
                buffer += __char;
            }
            if (mode === 3 && buffer === '!--') {
                mode = MODE_COMMENT;
                current = current[0];
            }
        }
    }
    commit();
    if (false) {
        return current.length > 2 ? current.slice(1) : current[1];
    }
    return current;
};
const CACHES = new Map();
const regular = function(statics) {
    let tmp = CACHES.get(this);
    if (!tmp) {
        tmp = new Map();
        CACHES.set(this, tmp);
    }
    tmp = evaluate(this, tmp.get(statics) || (tmp.set(statics, tmp = build(statics)), tmp), arguments, []);
    return tmp.length > 1 ? tmp : tmp[0];
};
const __default = false ? build : regular;
const jsx = __default.bind(h);
const hydrateLazy = (component, parent = null, removeChildNodes = true)=>{
    const c = h(Visible, null, component);
    return hydrate(c, parent, removeChildNodes);
};
class Store {
    _state;
    _prevState;
    _listeners = new Map();
    _storage;
    _id;
    constructor(defaultState, name = '', storage = 'memory'){
        if (typeof isSSR !== 'undefined') storage = 'memory';
        this._id = name;
        this._storage = storage;
        this._state = this._prevState = defaultState;
        if (storage === 'memory' || !storage) return;
        const Storage1 = storage === 'local' ? localStorage : sessionStorage;
        const item = Storage1.getItem(this._id);
        if (item) {
            this._state = this._prevState = JSON.parse(item);
        } else Storage1.setItem(this._id, JSON.stringify(defaultState));
    }
    persist(newState) {
        if (this._storage === 'memory') return;
        const Storage2 = this._storage === 'local' ? localStorage : sessionStorage;
        Storage2.setItem(this._id, JSON.stringify(newState));
    }
    clear() {
        this._state = this._prevState = undefined;
        if (this._storage === 'local') localStorage.removeItem(this._id);
        else if (this._storage === 'session') sessionStorage.removeItem(this._id);
    }
    setState(newState) {
        this.state = newState;
    }
    set state(newState) {
        this._prevState = this._state;
        this._state = newState;
        this.persist(newState);
        this._listeners.forEach((fnc)=>{
            fnc(this._state, this._prevState);
        });
    }
    get state() {
        return this._state;
    }
    use() {
        const id = Math.random().toString(36).substr(2, 9);
        const _this = this;
        return {
            get state () {
                return _this.state;
            },
            setState: (newState)=>{
                this.state = newState;
            },
            subscribe: (fnc)=>{
                this._listeners.set(id, fnc);
            },
            cancel: ()=>{
                this._listeners.delete(id);
            }
        };
    }
}
const createContext = (ctx)=>{
    let _ctx = ctx;
    return {
        Provider: (props3)=>{
            if (props3.value) _ctx = props3.value;
            return props3.children;
        },
        Consumer: (props3)=>{
            return {
                component: props3.children[0](_ctx),
                props: {
                    ...props3,
                    context: _ctx
                }
            };
        },
        get: ()=>_ctx
        ,
        set: (ctx1)=>_ctx = ctx1
    };
};
const withStyles = (styles)=>(WrappedComponent)=>{
        return class extends Component {
            render() {
                const { children: children1 , ...rest2 } = this.props;
                const helmet = h(Helmet, null, h('style', null, styles.toString()));
                const component = children1 && children1.length > 0 ? h(WrappedComponent, {
                    ...rest2
                }, children1) : h(WrappedComponent, {
                    ...this.props
                });
                return h(Fragment, null, helmet, component);
            }
        };
    }
;
const mod1 = function() {
    return {
        h,
        render,
        hydrate,
        tick,
        Component,
        jsx,
        hydrateLazy,
        nodeToString,
        task,
        renderSSR,
        Fragment,
        Store,
        createContext,
        withStyles,
        printVersion,
        VERSION,
        Helmet,
        Img,
        Link,
        Suspense,
        Visible,
        Router: mod
    };
}();
function render1() {
    return `Your new website!`;
}
new WebSocket("ws://localhost:1234").addEventListener("message", ()=>window.location.reload()
);
class LikeButton extends Component {
    count = 0;
    handleClick() {
        this.count++;
        this.update();
    }
    render() {
        return h("section", null, h("button", {
            onClick: ()=>this.handleClick()
        }, "I like it!"), h("p", null, "You liked this website ", h("b", null, this.count), " times."));
    }
}
mod1.render(h("main", null, h("h1", null, render1()), h(LikeButton, null)), document.body);
