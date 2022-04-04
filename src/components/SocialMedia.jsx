import React from "react";
// import { BsTwitter, BsInstagram } from "react-icons/bs";
// import { FaFacebookF } from "react-icons/fa";
import { AiFillGithub, AiFillLinkedin, AiFillYoutube } from "react-icons/ai";

const SocialMedia = () => {
  return (
    <div className="app__social">
      <a href="https://github.com/TrietTruong211" target="_blank">
        <div>
          <AiFillGithub />
        </div>
      </a>
      <a
        href="https://www.linkedin.com/in/triet-truong-minh-847971189"
        target="_blank"
      >
        <div>
          <AiFillLinkedin />
        </div>
      </a>
      {/* <a href="" taget="_blank">

      <div>
        <AiFillYoutube />
      </div>
      </a> */}
    </div>
  );
};

export default SocialMedia;
