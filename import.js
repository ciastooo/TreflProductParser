"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isomorphic_fetch_1 = __importDefault(require("isomorphic-fetch"));
const node_html_parser_1 = require("node-html-parser");
class Product {
    constructor(name, categories, price, special_price, description, imagePath) {
        this._name = name;
        this._categories = categories;
        this._price = price;
        this._special_price = special_price;
        this._description = description;
        this._imagePath = imagePath;
    }
    getCsvRow() {
        return "";
    }
}
class Import {
    constructor() {
        this.TreflProductListUrl = "https://sklep.trefl.com/pl/Filter/advanced/result/?price[from]=0&price[to]=9999&p={page}&limit=15&order=price&dir=asc";
    }
    import() {
        return __awaiter(this, void 0, void 0, function* () {
            let body = yield this.fetchPage(1);
            const pageCount = this.getPagesCount(body);
            var productList = [];
            console.log(`There is ${pageCount} product pages`);
            for (let i = 1; i <= pageCount; i++) {
                if (i != 1) {
                    body = yield this.fetchPage(i);
                }
                let parsedProducts = this.getProducts(body);
                productList.push(...parsedProducts);
            }
            return 0;
        });
    }
    fetchPage(page) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.TreflProductListUrl.replace("{page}", page.toString());
            console.log("fetching: ", url);
            const request = yield isomorphic_fetch_1.default(url);
            const body = yield request.text();
            return node_html_parser_1.parse(body);
        });
    }
    getPagesCount(body) {
        let lastPaginationNode = body.querySelector("#list .toolbar .pagination ol .last");
        if (!lastPaginationNode) {
            return 1;
        }
        return parseInt(lastPaginationNode.text);
    }
    getProducts(body) {
        let result = [];
        let productListNodes = body.querySelectorAll("#list .list li");
        productListNodes.forEach(node => {
            this.parseProductNode(node);
        });
        return result;
    }
    parseProductNode(productNode) {
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
