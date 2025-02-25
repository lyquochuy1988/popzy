Popzy.elements = [];

function Popzy(options = {}) {  
    this.opt = Object.assign({ 
        // templateID,
        closeMethods: ["button", "overlay", "escape"],
        destroyOnClose: true,
        cssClass: [],
        // onOpen,
        // onClose,
        footer: false,
    }, options);

    this.template = document.querySelector(`#${this.opt.templateID}`);

    if (!this.template) {
        console.error(`#${this.opt.templateID} not exists`);
        return;
    }

    const {closeMethods} = this.opt;

    this._allowButtonClose = closeMethods.includes("button");
    this._allowBackdropClose = closeMethods.includes("overlay");
    this._allowEscapeClose = closeMethods.includes("escape");

    this._footerButtons = [];

    this._handleEscapeKey = this._handleEscapeKey.bind(this);
    // Note: chỉ bind được khi this._handleEscapeKey là function() , còn array function thì không bind được
}

Popzy.prototype._build = function() {
    const content = this.template.content.cloneNode(true);

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
    const modalContent = document.createElement("div");
    modalContent.classList = "popzy__content";
    modalContent.append(content);
    modalContainer.append(modalContent);

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
    document.body.classList.add("popzy--no-scroll");
    document.body.style.paddingRight = this._getScrollbarWidth() + "px";

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
        if (!Popzy.elements.length) {
            document.body.classList.remove("popzy--no-scroll");
            document.body.style.paddingRight = "";
        }

        if (typeof this.opt.onClose === 'function') this.opt.onClose();
    })  
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