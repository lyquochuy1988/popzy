Popzy.elements = [];

function Popzy(options = {}) {  
    // If not both : content and templateID
    if (!options.content && !options.templateID) {
        console.error("You must provide one of 'content' or 'templateID'.");
        return;
    }

    // If have both : content and templateID
    if (options.content && options.templateID) {
        options.templateID = null;
        console.warn("If both are specified, content will take precedence, and templateId will be ignored.");
    }

    if (options.templateID) {
        this.template = document.querySelector(`#${options.templateID}`);

        if (!this.template) {
            console.error(`#${options.templateID} not exists`);
            return;
        }
    }

    this.opt = Object.assign({ 
        // templateID,
        enableScrollLock: true,
        scrollLockTarget: () => document.body,
        closeMethods: ["button", "overlay", "escape"],
        destroyOnClose: true,
        cssClass: [],
        // onOpen,
        // onClose,
        footer: false,
    }, options);

    this.content = this.opt.content;

    const {closeMethods} = this.opt;

    this._allowButtonClose = closeMethods.includes("button");
    this._allowBackdropClose = closeMethods.includes("overlay");
    this._allowEscapeClose = closeMethods.includes("escape");

    this._footerButtons = [];

    this._handleEscapeKey = this._handleEscapeKey.bind(this);
    // Note: chỉ bind được khi this._handleEscapeKey là function() , còn array function thì không bind được
}

Popzy.prototype._build = function() {
    const contentNode = this.content ? document.createElement("div") : this.template.content.cloneNode(true);

    if (this.content) {
        contentNode.innerHTML = this.content;
    }

    // Create Element Modal Backdrop
    this._modalBackdrop = document.createElement("div");
    this._modalBackdrop.classList = "popzy__backdrop";

    // Create Element Modal Container
    const modalContainer = document.createElement("div");
    modalContainer.classList = "popzy__container";

    this.opt.cssClass.forEach(className => {
        if (typeof className === "string") {
            modalContainer.classList.add(className);
        }
    });

    if (this._allowButtonClose) {
        const modalClose = this._createButton("&times", "popzy__close", () => this.close());

        modalContainer.append(modalClose);        
    }

    // Create Element Modal Content
    this._modalContent = document.createElement("div");
    this._modalContent.classList = "popzy__content";
    this._modalContent.append(contentNode);
    modalContainer.append(this._modalContent);

    if (this.opt.footer) {
        this._modalFooter = document.createElement("div");
        this._modalFooter.classList = "popzy__footer";

        this._renderFooterContent();
        this._renderFooterButtons();

        modalContainer.append(this._modalFooter);
    }

    // Append Element        
    this._modalBackdrop.append(modalContainer);
    document.body.append(this._modalBackdrop);
}

Popzy.prototype.setContent = function(content) {
    this.content = content;

    if (this._modalContent) {
        this._modalContent.innerHTML = this.content;
    }
}

Popzy.prototype.setFooterContent = function(html) {
    this._footerContent = html;
    this._renderFooterContent();
}

Popzy.prototype.addFooterButton = function(title, cssClass, callback) {
    const button = this._createButton(title, cssClass, callback);
    this._footerButtons.push(button);

    this._renderFooterButtons();
}

Popzy.prototype._renderFooterContent = function() {
    if (this._modalFooter && this._footerContent) {
        this._modalFooter.innerHTML = this._footerContent;
    }
}

Popzy.prototype._renderFooterButtons = function() {
    if (this._modalFooter) {
        this._footerButtons.forEach(button => {
            this._modalFooter.append(button);
        });
    }
}

Popzy.prototype._createButton = function(title, cssClass, callback) {
    const button = document.createElement("button");
    button.className = cssClass;
    button.innerHTML = title;
    button.onclick = callback;

    return button;
}

Popzy.prototype.open = function() {
    Popzy.elements.push(this);
    
    if (!this._modalBackdrop) {
        this._build();
    }

    // Add Class show to this._modalBackdrop
    if (this._modalBackdrop) {
        setTimeout(() => {
            this._modalBackdrop.classList.add("popzy--show");
        }, 0);
    }        

    // Modal Backdrop click
    if (this._allowBackdropClose) {
        this._modalBackdrop.onclick = (e) => {
            if (e.target === this._modalBackdrop) {
                this.close();
            }
        }
    }

    // Escape keydown close modal
    if (this._allowEscapeClose) {
        document.addEventListener("keydown", this._handleEscapeKey);

        // document.keydown = this._handleEscapekey;
        // document.keydown();
    }

    // Add class no-scroll : disable scrolling
    if (Popzy.elements.length === 1 && this.opt.enableScrollLock) {
        const target = this.opt.scrollLockTarget();

        if (this._hasScrollBar(target)) {
            target.classList.add("popzy--no-scroll");

            const targetPadRight = parseInt(getComputedStyle(target).paddingRight);
            target.style.paddingRight = targetPadRight + this._getScrollbarWidth() + "px";
        }

    }

    this._onTransitionEnd(this.opt.onOpen);

    return this._modalBackdrop;
}

Popzy.prototype._handleEscapeKey = function(e) {
    const lastModal = Popzy.elements[Popzy.elements.length - 1];
    if (e.key === "Escape" && this === lastModal) {
        this.close();
    }
}

Popzy.prototype._onTransitionEnd = function(callback) {
    this._modalBackdrop.ontransitionend = (e) => {            
        if (e.propertyName !== 'transform') return;    
        if (typeof callback === 'function') callback();
    }
}

Popzy.prototype.close = function(destroy = this.opt.destroyOnClose) {
    Popzy.elements.pop();
    this._modalBackdrop.classList.remove("popzy--show");

    // Escape keydown close modal
    if (this._allowEscapeClose) {
        document.removeEventListener("keydown", this._handleEscapeKey);
    }
   
    this._onTransitionEnd(() => {
        if (this._modalBackdrop && destroy) {                
            this._modalBackdrop.remove();
            this._modalBackdrop = null;
            this._modalFooter = null;
        }

        // Remove class no-scroll : enable scrolling
        if (this.opt.enableScrollLock && !Popzy.elements.length) {
            const target = this.opt.scrollLockTarget();

            if (this._hasScrollBar(target)) {
                target.classList.remove("popzy--no-scroll");
                target.style.paddingRight = "";
            }
        }

        if (typeof this.opt.onClose === 'function') this.opt.onClose();
    })  
}

Popzy.prototype._hasScrollBar = function(target) {
    if ([document.documentElement, document.body].includes(target)) {
        return document.documentElement.scrollHeight > document.documentElement.clientHeight ||
                document.body.scrollHeight > document.body.clientHeight;
    }

    return target.scrollHeight > target.clientHeight;
}

Popzy.prototype.destroy = function() {
    this.close(true);
}

Popzy.prototype._getScrollbarWidth = function() {
    if (this._scrollbarWidth) return this._scrollbarWidth;

    const div = document.createElement("div");
    Object.assign(div.style, {
        overflow: "scroll",
        position: "absolute",
        top: "-9999px",
    });

    document.body.appendChild(div);

    this._scrollbarWidth = div.offsetWidth - div.clientWidth;
    
    document.body.removeChild(div);

    return this._scrollbarWidth;
}