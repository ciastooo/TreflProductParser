import fetch from 'isomorphic-fetch';
import {
    parse,
    HTMLElement
} from 'node-html-parser';
import {
    ExportToCsv
} from 'export-to-csv';

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
}

class Import {
    private TreflProductListUrl: string = "https://sklep.trefl.com/pl/Filter/advanced/result/?price[from]=0&price[to]=9999&p={page}&limit=200&order=price&dir=asc"

    async import(): Promise < number > {
        const body = await this.fetchPage(1);
        const pageCount = this.getPagesCount(body);
        let productListPromiseArray: Promise<Product[]>[] = [];
        let fetchPromiseArray: Promise < HTMLElement > [] = [];
        let parsedProductList: Product[] = [];

        console.log(`There is ${pageCount} product pages...`)

        for (let i = 2; i <= pageCount; i++) {
            fetchPromiseArray.push(this.fetchPage(i));
        }
        let parsedPages = [body, ...(await Promise.all(fetchPromiseArray))];
        console.log("Parsing products...")
        productListPromiseArray = productListPromiseArray.concat(parsedPages.map(p => this.getProducts(p)));

        parsedProductList = parsedProductList.concat(...await Promise.all(productListPromiseArray));
        console.log(`Parsed ${parsedProductList.length} products...`)

        this.exportToCsv(parsedProductList);

        return 0;
    }

    private async fetchPage(page: number): Promise < HTMLElement > {
        const url = this.TreflProductListUrl.replace("{page}", page.toString());
        console.log(`Fetching ${url}`);
        const request = await fetch(url);
        const body = await request.text();
        return parse(body);
    }

    private getPagesCount(body: HTMLElement): number {
        const lastPaginationNode = body.querySelector("#list .toolbar .pagination ol .last");
        if (!lastPaginationNode) {
            return 1;
        }
        return parseInt(lastPaginationNode.text);
    }

    private async getProducts(body: HTMLElement): Promise<Product[]> {
        const resultProductsPromiseArray: Promise<Product>[] = [];
        const productListNodes = body.querySelectorAll("#list .list li");
        productListNodes.forEach(node => {
            resultProductsPromiseArray.push(this.parseProductNode(node as HTMLElement));
        });
        return await Promise.all(resultProductsPromiseArray);
    }

    private async parseProductNode(productNode: HTMLElement): Promise<Product> {
        const name = productNode.querySelector("a .main h4").text;
        const categories = productNode.querySelectorAll(".info dt").map(n => n.text);
        let price: string = "";
        let specialPrice: string = "";
        let searchPrice = productNode.querySelector("a .main .price .old-price");
        if (searchPrice) {
            price = searchPrice.text.replace(/[^,0-9]+/gi, "");
            specialPrice = productNode.querySelector("a .main .price .big-price").text.replace(/[^,0-9]+/gi, "");
        } else {
            price = productNode.querySelector("a .main .price").text.replace(/[^,0-9]+/gi, "")
        }
        const description = productNode.querySelector("a .main p").text;
        const imagePath = await this.downloadPhoto(productNode.querySelector("a .main img") as HTMLElement);

        const resultProduct = new Product(name, categories, price, specialPrice, description, imagePath);
        return resultProduct;
    }

    private async downloadPhoto(imgElement: HTMLElement): Promise<string> {
        const regExp = new RegExp(/<img[^>]+src="([^">]+)/);
        const imgTag = imgElement.toString().match(regExp);
        if(!imgTag || imgTag.length == 0) {
            return "";
        }
        const imageUrl = imgTag[0].toString().substring(10);
        // Don't execute this:
        // const request = await fetch(imageUrl);
        // const body = await request.text();
        console.log(imageUrl);
        return imageUrl;
    }

    private exportToCsv(productList: Product[]) {

    }
}

var imp = new Import();
imp.import();