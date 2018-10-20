import fetch from 'isomorphic-fetch';
import {
    parse,
    HTMLElement,
    Node
} from 'node-html-parser';

class Product {
    private _name: string;
    private _categories: string[];
    private _price: number;
    private _special_price: number;
    private _description: string;
    private _imagePath: string;

    constructor(name: string, categories: string[], price: number, special_price: number, description: string, imagePath: string) {
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
        let result: Product[] = [];
        let productListNodes = body.querySelectorAll("#list .list li");
        productListNodes.forEach(node => {
            this.parseProductNode(node as HTMLElement);
        });
        return result;
    }

    private parseProductNode(productNode: HTMLElement) {
        let name = productNode.querySelector("a h4").text;
        let categories = productNode.querySelectorAll(".info ").map(n => n.text);
        let price = productNode.querySelector("a ").text;
        let special_price = 1;
        let description = "";
        let imagePath = "";
        console.log(name, categories, price, special_price, description, imagePath);
        
        return null;
    }
}

var a = new Import();
a.import();