import React, {Component} from 'react';
import {linkData} from '../context/linkData';
import {socialData} from '../context/socialData';
import {servicesData} from '../context/ServicesData';
import {items} from '../context/productData';

const ProductContext = React.createContext();
//provider
//consumer

class ProductProvider extends Component {
    state={
        sidebarOpen: false,
        cartOpen: false,
        cartItems: 0,
        Links: linkData,
        socialIcons: socialData,
        ServiceData: servicesData,
        cart: [],
        CartItems: 0,
        cartSubTotal: 0,
        cartTax: 0,
        cartTotal: 0,
        storeProduct: [],
        filterProduct: [],
        featuredProducts: [],
        singleProduct: {},
        loading: true,
        search: "",
        price: 0,
        min: 0,
        max: 0,
        company: "all",
        shipping: false
    };
    componentDidMount(){
        this.setProducts(items);
    }
    
    setProducts = products => {
        let storeProduct = products.map(item => {
            const {id} = item.sys;
            const image = item.fields.image.fields.file.url;
            const product = {id, ...item.fields, image}
            return product;
        });
        //featured products
        const featuredProducts = storeProduct.filter(item => item.featured === true);
        
        //get max price
        let maxPrice = Math.max(...storeProduct.map(item => item.price));
        //console.log(maxPrice)

        this.setState(
            {
                storeProduct,
                filterProduct: storeProduct,
                featuredProducts,
                cart: this.getStoreCart(),
                singleProduct: this.getStoreProduct(),
                loading: false,
                addToCart: this.addToCart,
                max: maxPrice,
                price: maxPrice
            },
                () => {
                this.addTotals();
            }
        );
    };
    // get cart product from local storage
    getStoreCart = () => {
        let cart;
        if(localStorage.getItem('cart'))
        {
            cart = JSON.parse(localStorage.getItem('cart'))
        }else{
            cart = [];
        }
        return cart;
    };
    // get store product from local storage
    getStoreProduct = () => {
        return localStorage.getItem('singleProduct')
            ? JSON.parse(localStorage.getItem('singleProduct'))
            : {};
    }
    //get totals
    getTotal = () => {
        let subTotal = 0;
        let cartItems = 0;
        this.state.cart.forEach(item => {
            subTotal += item.total;
            cartItems += item.count;
        });

        subTotal = parseFloat(subTotal.toFixed(2));
        let tax = subTotal * 0.2;
        tax = parseFloat(tax.toFixed(2));
        let total = subTotal + tax;
        total = parseFloat(total.toFixed(2));
        return {
            cartItems,
            subTotal,
            tax,
            total
        };
    };
    //add totals
    addTotals = () => {
        const totals = this.getTotal();
        this.setState({
            cartItems: totals.cartItems,
            cartSubTotal: totals.subTotal,
            cartTax: totals.tax,
            cartTotal: totals.total
        })
    }
    //sync storage
    syncStorage = () => {
        localStorage.setItem("cart",JSON.stringify(this.state.cart));
    }
    //Add to Cart
    addToCart = (id) => {
        let tempCart = [...this.state.cart];
        let tempProducts = [...this.state.storeProduct];
        let tempItem = tempCart.find(item => item.id ===id);
        if(!tempItem)
        {
            tempItem = tempProducts.find(item => item.id === id);
            let total = tempItem.price;
            let cartItem = {...tempItem, count: 1, total};
            tempCart = [...tempCart, cartItem];
        }else{
            tempItem.count++;
            tempItem.total = tempItem.price * tempItem.count;
            tempItem.total = parseFloat(tempItem.total.toFixed(2));
        }
        this.setState(
            () => {
                return { cart: tempCart };
            },
            () => {
                this.addTotals();
                this.syncStorage();
                this.openCart();
            }
        )
    }
    setSignleProducts = (id) => {
        let product = this.state.storeProduct.find(item => item.id === id);
        localStorage.setItem('singleProduct', JSON.stringify(product))
        this.setState({
            singleProduct: {...product},
            loading: false
        });
    }

    


    //Handle Sidebar
    handleSidebar = () => {
        this.setState({sidebarOpen: !this.state.sidebarOpen})
    }
    //Handle Cart
    handleCart = () =>{
        this.setState({cartOpen: !this.state.cartOpen})
    }
    //close cart
    closeCart = () =>{
        this.setState({cartOpen: false})
    }
    //open Cart
    openCart = () =>{
        this.setState({cartOpen: true})
    }
    //increment item
    incrementCart = (id) =>{
        let tempCart = [...this.state.cart];
        const cartItem = tempCart.find(item => item.id === id);
        cartItem.count++;
        cartItem.total = cartItem.count * cartItem.price;
        cartItem.total = parseFloat(cartItem.total.toFixed(2));
        this.setState(
            () => {
                return {
                    cart: [...tempCart]
                };
            },
            () => {
                this.addTotals();
                this.syncStorage();
            }
        )
    }
    //decrement item
    decrementCart = (id) =>{
        let tempCart = [...this.state.cart];
        const cartItem = tempCart.find(item => item.id === id);

        cartItem.count = cartItem.count -1;
        if(cartItem.count === 0)
        {
            this.removeItem(id);
        }else{
            cartItem.total = cartItem.count * cartItem.price;
            cartItem.total = parseFloat(cartItem.total.toFixed(2));
            this.setState(
                () => {
                    return{
                        cart: [...tempCart]
                    };
                },
                () => {
                    this.addTotals();
                    this.syncStorage();
                }
            )
        }
    }
    //remove item
    removeItem = (id) =>{
        let tempCart = [...this.state.cart];
        tempCart = tempCart.filter(item => item.id !==id);
        this.setState(
            {
                cart: [...tempCart]
            },
            () => {
                this.addTotals();
                this.syncStorage();
            }
        )
    }
    //clear item
    clearCart = () =>{
        this.setState(
            {
                cart: []
            },
            () => {
                this.addTotals();
                this.syncStorage();
            }
        )
    }

    //handle filtering
    handleChange = event => {
        const name = event.target.name;
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        
        this.setState(
            {
                [name] : value
            },
            this.sortData
        );
    };
    sortData = () => {
        const {storeProduct, price, company, shipping, search} = this.state;

        let tempPrice = parseInt(price);

        let tempProducts = [...storeProduct];
        //filtering based on price
        tempProducts = tempProducts.filter(item => item.price <= tempPrice);
        //filtering based on company
        if(company !== "all")
        {
            tempProducts = tempProducts.filter(item => item.company === company);
        }
        if(shipping)
        {
            tempProducts = tempProducts.filter(item => item.freeShipping === true);
        }
        if(search.length > 0)
        {
            tempProducts = tempProducts.filter(item => {
                let tempSearch = search.toLowerCase();
                let tempTitle = item.title.toLowerCase().slice(0, search.length);
                if (tempSearch === tempTitle) {
                  return item;
                }
            });
        }
        this.setState({filterProduct: tempProducts})
    }

    render() {
        return (
            <ProductContext.Provider value={{
                ...this.state,
                handleSidebar: this.handleSidebar,
                handleCart: this.handleCart,
                closeCart: this.closeCart,
                openCart: this.openCart,
                setSignleProducts: this.setSignleProducts,
                increment: this.incrementCart,
                decrement: this.decrementCart,
                removeItem: this.removeItem,
                clearCart: this.clearCart,
                handleChange: this.handleChange
            }}>
                {this.props.children}
            </ProductContext.Provider>
        );
    }
}

const ProductConsumer = ProductContext.Consumer;

export {ProductProvider, ProductConsumer};

