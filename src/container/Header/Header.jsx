import React, { useState, useEffect } from "react";
import "./Header.scss";
import { motion } from "framer-motion";
import { images } from "../../constants";
import { AppWrap, MotionWrap } from "../../wrapper";
import { urlFor, client } from "../../client";
import BackgroundAnimation from "../../BackgroundAnimation/BackgroundAnimation";

const scaleVariants = {
  whileInView: {
    scale: [0, 1],
    opacity: [0, 1],
    transition: {
      duration: 1,
      ease: "easeInOut",
    },
  },
};

const Header = () => {
  const [headerData, setHeaderData] = useState({});

  useEffect(() => {
    const query = '*[_type == "miscellaneous"]';

    client.fetch(query).then((data) => {
      setHeaderData(data[0]);
    });
  }, []);

  return (
    <div className="app__header app__flex">
      <motion.div
        whileInView={{ x: [-100, 0], opacity: [0, 1] }}
        transition={{ duration: 0.5 }}
        className="app__header-info"
      >
        <div className="app__header-badge">
          <div className="badge-cmp app__flex">
            <span>👋</span>
            <div style={{ marginLeft: 20 }}>
              <p className="p-text">{headerData?.greeting}</p>
              <h1 className="head-text">{headerData?.name}</h1>
            </div>
          </div>
          <div className="tag-cmp app__flex">
            {/* <p className="p-text">Web Developer </p>
            <p className="p-text">Shopify Developer </p> */}
            {headerData?.title?.split("\n").map((str) => (
              <p className="p-text">{str}</p>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        whileInView={{ opacity: [0, 1] }}
        transition={{ duration: 0.5, delayChildren: 0.5 }}
        className="app__header-img"
      >
        {headerData.profileImage && (
          <img src={urlFor(headerData?.profileImage)} alt="profile_bg" />
        )}
        {/* <motion.img
          whileInView={{ scale: [0, 1] }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="overlay_circle"
          src={images.circle}
          alt="profile_circle"
        /> */}
        <BackgroundAnimation />
      </motion.div>

      <motion.div
        variant={scaleVariants}
        whileInView={scaleVariants.whileInView}
        className="app__header-circles"
      >
        {[images.react, images.shopify, images.javascript].map(
          (circle, index) => (
            <div className="circle-cmp app__flex" key={`circle-${index}`}>
              <img src={circle} alt="circle" />
            </div>
          )
        )}
      </motion.div>
    </div>
  );
};

export default AppWrap(
  MotionWrap(Header, "app__header"),
  "home",
  "app__primarybg"
);
