import axios from "axios";
import React, { useContext, useEffect, useReducer } from "react";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import { Link, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import LoadingBox from "../components/LoadingBox/LoadingBox";
import MessageBox from "../components/MessageBox/MessageBox";
import { Store } from "../Store";
import { getError } from "../Utils";
import { toast } from "react-toastify";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return {
        ...state,
        products: action.payload.products,
        page: action.payload.page,
        pages: action.payload.pages,
        loading: false,
      };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "CREATE_REQUEST":
      return { ...state, loadingCreate: true };
    case "CREATE_SUCCESS":
      return { ...state, loadingCreate: false };
    case "CREATE_FAIL":
      return { ...state, loadingCreate: false };
    default:
      return state;
  }
};

export default function ProductListScreen() {
  const navigate = useNavigate();
  //deconstruct all properties from useReducer hook and get dispatch to call appropriate action
  const [{ loading, error, products, pages, loadingCreate }, dispatch] =
    useReducer(reducer, {
      loading: true,
      error: "",
    });
  const { search } = useLocation(); //come from react-router-dom
  //Get the search parameter
  const sp = new URLSearchParams(search); //we pass search to the constructor to get search parameter object
  //Check the page value
  const page = sp.get("page") || 1; //if undefined use 1 by default
  //get userInfo from the context
  const { state } = useContext(Store);
  const { userInfo } = state;
  useEffect(() => {
    const fetchData = async () => {
      try {
        //we send page in query parameter GET, it's gonna be retrieve by backend api
        const { data } = await axios.get(`/api/products/admin?page=${page}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    fetchData();
  }, [page, userInfo]);

  //Define createHandler
  const createHandler = async () => {
    if (window.confirm("Are you sure to create?")) {
      try {
        dispatch({ type: "CREATE_REQUEST" });
        const { data } = await axios.post(
          "/api/products",
          {
            //empty body because we don't send data to create a sample product
          },
          {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }
        );
        //if succeed
        toast.success("product created successfully");
        dispatch({ type: "CREATE_SUCCESS" });
        navigate(`/admin/product/${data.product._id}`);
      } catch (err) {
        toast.error(getError(error));
        dispatch({ type: "CREATE_FAIL" });
      }
    }
  };

  return (
    <div>
      <Row>
        <Col>
          <h1>Products</h1>
        </Col>
        <Col className="col text-end">
          <div>
            <Button type="button" onClick={createHandler}>
              Create Product
            </Button>
          </div>
        </Col>
      </Row>
      {loadingCreate && <LoadingBox></LoadingBox>}

      {loading ? (
        <LoadingBox></LoadingBox>
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        //we set contain part inside an empty container
        <>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>NAME</th>
                <th>PRICE</th>
                <th>CATEGORY</th>
                <th>BRAND</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>{product._id}</td>
                  <td>{product.name}</td>
                  <td>{product.price}</td>
                  <td>{product.category}</td>
                  <td>{product.brand}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            {
              //return array from 0 to pages minus one and we use map function to convert it into a link
              [...Array(pages).keys()].map((x) => (
                <Link
                  className={x + 1 === Number(page) ? "btn text-bold" : "btn"}
                  key={x + 1}
                  to={`/admin/products?page=${x + 1}`}
                >
                  {x + 1}
                </Link>
              ))
            }
          </div>
        </>
      )}
    </div>
  );
}
