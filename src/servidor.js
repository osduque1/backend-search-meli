const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const bodyParser = require("body-parser");
const axios = require("axios");
const { isEmpty } = require("lodash");

app.use(bodyParser.json());
app.use(cors());

app.listen(process.env.PORT || 3001, () => {
  console.log(
    `El servidor está inicializado en el puerto ${process.env.PORT || 3001}`
  );
});

const ITEMS_QUANTITY = 4;
const endPointProducts = "https://api.mercadolibre.com/sites/MLA/search";
const endPointDetail = "https://api.mercadolibre.com/items/";

app.get("/api/items", async (req, res, next) => {
  try {
    const query = req._parsedUrl.search;
    const endPoint = `${endPointProducts}${query}&limit=${ITEMS_QUANTITY}`;
    const item = await axios.get(endPoint).catch((err) => {
      res.status(500).json({ Code: "500", Message: "Server Error" });
      console.log("Error 404 in endpoint products");
      next(err);
    });

    if (!isEmpty(item)) {
      const items = item.data.results.map((item) => ({
        id: item.id,
        title: item.title,
        price: {
          currency: item.currency_id,
          amount: Number(item.price),
          decimals: Number((item.price % 1).toFixed(2)),
        },
        picture: item.thumbnail,
        condition: item.condition,
        free_shipping: item.shipping.free_shipping,
        address: item.address.city_name,
      }));

      const filters = item.data.filters;
      const available_filters = item.data.available_filters;

      const filterNew =
        !isEmpty(available_filters) &&
        available_filters
          .find(({ id }) => id === "category")
          ?.values.sort((a, b) => b.results - a.results)
          ?.map((el) => el.name);

      const filterCategory = isEmpty(filterNew)
        ? filters
            .find(({ id }) => id === "category")
            ?.values.map((el) => el.path_from_root)[0]
            ?.map((value) => value.name)
        : filterNew;

      const response = {
        author: {
          name: "Oscar",
          lastname: "Duque",
        },
        categories: !isEmpty(filterCategory) && filterCategory.slice(0, 5),
        items,
      };

      if (!isEmpty(item.data.results)) {
        res.send(response);
      } else {
        res
          .status(200)
          .json({ Code: "202", Message: "Successful Without Data" });
      }
    }
  } catch (error) {
    console.error(error);
    next(error);
    res.status(500).json({ Code: "500", Message: "Server Error" });
  }
});

app.get("/api/items/:id", async (req, res, next) => {
  try {
    const id = req.params.id.replace(":", "");

    const dataService = await axios
      .get(`${endPointDetail}${id}`)
      .catch((err) => {
        res.status(500).json({ Code: "500", Message: "Server Error" });
        console.log("Error 404 in endpoint dataService");
        next(err);
      });
    const descriptionService = await axios
      .get(`${endPointDetail}${id}/description`)
      .catch((err) => {
        console.log(
          "Error 404 in Description previosly by enpoint dataService"
        );
        next(err);
      });

    if (!isEmpty(dataService)) {
      const { data: item } = dataService;
      const { data: resDescription } = descriptionService;

      const decimals = Number((item.price % 1).toFixed(2));

      const itemDetail = {
        id: item.id,
        title: item.title,
        price: {
          currency: item.currency_id,
          amount: Number(item.price),
          decimals,
        },
        picture: item.pictures[0].url || item.thumbnail,
        condition: item.condition,
        free_shipping: item.shipping.free_shipping,
        sold_quantity: Number(item.sold_quantity),
        description: resDescription.plain_text || null,
      };

      const response = {
        author: {
          name: "Oscar",
          lastname: "Duque",
        },
        item: itemDetail,
      };

      if (!isEmpty(item)) {
        res.send(response);
      } else {
        res
          .status(200)
          .json({ Code: "202", Message: "Successful Without Data" });
      }
    }
  } catch (error) {
    console.error(error);
    next(error);
    res.status(500).json({ Code: "500", Message: "Server Error" });
  }
});
