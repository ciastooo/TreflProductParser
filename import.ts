import fetch from 'isomorphic-fetch';
import {
    parse,
    HTMLElement,
    Node
} from 'node-html-parser';

class Product {
    private _name: string;
    private _categories: string[];
    private _price: string;
    private _special_price: string;
    private _description: string;
    private _imagePath: string;

    constructor(name: string, categories: string[], price: string, special_price: string, description: string, imagePath: string) {
        this._name = name;
        this._categories = categories;
        this._price = price;
        this._special_price = special_price;
        this._description = description;
        this._imagePath = imagePath;
    }

    public getCsvRow(): string {
        return "";
    }
}

class Import {
    private TreflProductListUrl: string = "https://sklep.trefl.com/pl/Filter/advanced/result/?price[from]=0&price[to]=9999&p={page}&limit=15&order=price&dir=asc"

    async import(): Promise < number > {
        let body = await this.fetchPage(1);
        const pageCount = this.getPagesCount(body);
        var productList: Product[] = [];
        console.log(`There is ${pageCount} product pages`)
        for (let i = 1; i <= pageCount; i++) {
            if (i != 1) {
                body = await this.fetchPage(i);
            }
            let parsedProducts: Product[] = this.getProducts(body);
            productList.push(...parsedProducts);
        }

        return 0;
    }

    private async fetchPage(page: number): Promise < HTMLElement > {
        const url = this.TreflProductListUrl.replace("{page}", page.toString());
        console.log("fetching: ", url);
        const request = await fetch(url);
        const body = await request.text();
        return parse(body);
    }

    private getPagesCount(body: HTMLElement): number {
        let lastPaginationNode = body.querySelector("#list .toolbar .pagination ol .last");
        if (!lastPaginationNode) {
            return 1;
        }
        return parseInt(lastPaginationNode.text);
    }

    private getProducts(body: HTMLElement): Product[] {
        let resultProducts: Product[] = [];
        let productListNodes = body.querySelectorAll("#list .list li");
        productListNodes.forEach(node => {
            resultProducts.push(this.parseProductNode(node as HTMLElement));
        });
        return resultProducts;
    }

    private parseProductNode(productNode: HTMLElement): Product {
        let name = productNode.querySelector("a h4").text;
        let categories = productNode.querySelectorAll(".info dt").map(n => n.text);
        let price:string = "";
        let specialPrice:string = "";
        let searchPrice = productNode.querySelector("a .price .old-price");
        if(searchPrice) {
            price = searchPrice.text.replace(/[^,0-9]+/gi, "");
            specialPrice = productNode.querySelector("a .price .big-price").text.replace(/[^,0-9]+/gi, "");
        } else {
            price = productNode.querySelector("a .price").text.replace(/[^,0-9]+/gi, "")
        }
        let description = productNode.querySelector("a p").text;
        let imagePath = "";
        
        let resultProduct = new Product(name, categories, price, specialPrice, description, imagePath);        
        return resultProduct;
    }
}

var a = new Import();
a.import();