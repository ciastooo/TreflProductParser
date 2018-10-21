import fetch from 'isomorphic-fetch';
import {
    parse,
    HTMLElement
} from 'node-html-parser';
import fs from "fs";

class Product {
    public name: string;
    public categories: string[];
    public price: string;
    public special_price: string;
    public description: string;
    public imagePath: string;

    constructor(name: string, categories: string[], price: string, special_price: string, description: string, imagePath: string) {
        this.name = name;
        this.categories = categories;
        this.price = price;
        this.special_price = special_price;
        this.description = description;
        this.imagePath = imagePath;
    }
}

class Import {
    private TreflProductListUrl: string = "https://sklep.trefl.com/pl/Filter/advanced/result/?price[from]=0&price[to]=9999&p={page}&limit=200&order=price&dir=asc"
    private CsvHeaderList: string[] = "sku,store_view_code,attribute_set_code,product_type,categories,product_websites,name,description,short_description,weight,product_online,tax_class_name,visibility,price,special_price,special_price_from_date,special_price_to_date,url_key,meta_title,meta_keywords,meta_description,base_image,base_image_label,small_image,small_image_label,thumbnail_image,thumbnail_image_label,swatch_image,swatch_image_label,created_at,updated_at,new_from_date,new_to_date,display_product_options_in,map_price,msrp_price,map_enabled,gift_message_available,custom_design,custom_design_from,custom_design_to,custom_layout_update,page_layout,product_options_container,msrp_display_actual_price_type,country_of_manufacture,additional_attributes,qty,out_of_stock_qty,use_config_min_qty,is_qty_decimal,allow_backorders,use_config_backorders,min_cart_qty,use_config_min_sale_qty,max_cart_qty,use_config_max_sale_qty,is_in_stock,notify_on_stock_below,use_config_notify_stock_qty,manage_stock,use_config_manage_stock,use_config_qty_increments,qty_increments,use_config_enable_qty_inc,enable_qty_increments,is_decimal_divided,website_id,related_skus,related_position,crosssell_skus,crosssell_position,upsell_skus,upsell_position,additional_images,additional_image_labels,hide_from_product_page,custom_options,bundle_price_type,bundle_sku_type,bundle_price_view,bundle_weight_type,bundle_values,bundle_shipment_type,configurable_variations,configurable_variation_labels,associated_skus".split(",")

    async import(): Promise < number > {
        const body = await this.fetchPage(1);
        const pageCount = this.getPagesCount(body);
        let productListPromiseArray: Promise < Product[] > [] = [];
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

        this.exportToCsv(parsedProductList, this.CsvHeaderList);

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

    private async getProducts(body: HTMLElement): Promise < Product[] > {
        const resultProductsPromiseArray: Promise < Product > [] = [];
        const productListNodes = body.querySelectorAll("#list .list li");
        productListNodes.forEach(node => {
            resultProductsPromiseArray.push(this.parseProductNode(node as HTMLElement));
        });
        return await Promise.all(resultProductsPromiseArray);
    }

    private async parseProductNode(productNode: HTMLElement): Promise < Product > {
        const name = productNode.querySelector("a .main h4").text;
        const categories = productNode.querySelectorAll(".info dd").map(n => n.text);
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

    private async downloadPhoto(imgElement: HTMLElement): Promise < string > {
        const regExp = new RegExp(/<img[^>]+src="([^">]+)/);
        const imgTag = imgElement.toString().match(regExp);
        if (!imgTag || imgTag.length == 0) {
            return "";
        }
        const imageUrl = imgTag[0].toString().substring(10);
        // Don't execute this:
        // const request = await fetch(imageUrl);
        // const body = await request.text();
        return imageUrl;
    }

    private exportToCsv(productList: Product[], headers: string[], separator: string = ',', lineSeparator: string = "\n") {
        let csvResult = headers.join(",") + lineSeparator;
        const today = new Date();
        const todayHours = today.getHours() >= 12 ? `${today.getHours()-12}:${today.getMinutes()} PM` : `${today.getHours()}:${today.getMinutes()} PM`;

        console.log("Saving csv file...");
        productList.forEach(product => {
            let newLine = new Array < string > (headers.length);
            newLine[0] = product.name;
            newLine[2] = "Default";
            newLine[3] = "simple";
            newLine[4] = product.categories.join(", ");
            newLine[5] = "base";
            newLine[6] = product.name;
            newLine[7] = product.description;
            newLine[8] = product.description;
            newLine[10] = "1";
            newLine[11] = "Taxable Goods";
            newLine[12] = "Catalog, Search";
            newLine[13] = product.price.toString();
            newLine[14] = product.special_price;
            newLine[18] = product.name.toLowerCase();
            newLine[19] = product.name;
            newLine[20] = product.name;
            newLine[21] = product.imagePath;
            newLine[29] = `${today.getMonth()}/${today.getDay()}/${today.getFullYear()} ${todayHours}`;
            newLine[30] = `${today.getMonth()}/${today.getDay()}/${today.getFullYear()} ${todayHours}`;
            newLine[33] = "Block after Info Column";
            newLine[37] = "Ude config";
            newLine[47] = "10";
            newLine[48] = "0";
            newLine[49] = "1";
            newLine[50] = "0";
            newLine[51] = "0";
            newLine[52] = "1";
            newLine[53] = "1";
            newLine[54] = "1";
            newLine[55] = "10000";
            newLine[56] = "1";
            newLine[57] = "1";
            newLine[58] = "1";
            newLine[59] = "1";
            newLine[60] = "1";
            newLine[61] = "1";
            newLine[62] = "1";
            newLine[63] = "1";
            newLine[64] = "1";
            newLine[65] = "0";
            newLine[66] = "0";
            newLine[67] = "0";
            newLine[75] = product.imagePath;
            csvResult = csvResult + newLine.join(",") + lineSeparator;
        });
        fs.writeFileSync("import.csv", csvResult);
        console.log("File saved as \"import.csv\"")
    }
}

var imp = new Import();
imp.import();