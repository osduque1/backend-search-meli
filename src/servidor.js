const express = require("express");
require("dotenv").config();
const cors = require("cors");

const app = express();
const axios = require("axios");
const _ = require("lodash");
app.use(cors());

app.listen(process.env.PORT || 3001, () => {
  console.log(
    `El servidor está inicializado en el puerto ${process.env.PORT || 3001}`
  );
});

const endPointProducts = "https://api.mercadolibre.com/sites/MLA/search?q=";
const endPointDetail = "https://api.mercadolibre.com/items/";

app.get("/api/items", async (req, res, next) => {
  try {
    const query = req.query.q;
    const item = await axios
      .get(`${endPointProducts}${query}`)
      .catch((err) => next(err));

    if (!_.isEmpty(item)) {
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
        !_.isEmpty(available_filters) &&
        available_filters
          .find(({ id }) => id === "category")
          ?.values.sort((a, b) => b.results - a.results)
          ?.map((el) => el.name);

      const filterCategory = _.isEmpty(filterNew)
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
        categories: filterCategory,
        items,
      };

      if (!_.isEmpty(item.data.results)) {
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

    const [dataService, descriptionService] = await axios.all([
      axios.get(`${endPointDetail}${id}`).catch((err) => next(err)),
      axios.get(`${endPointDetail}${id}/description`).catch((err) => next(err)),
    ]);

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

    if (!_.isEmpty(item)) {
      res.send(response);
    } else {
      res.status(200).json({ Code: "202", Message: "Successful Without Data" });
    }
  } catch (error) {
    console.error(error);
    next(error);
    res.status(500).json({ ok: false, message: "Server Error" });
  }
});
