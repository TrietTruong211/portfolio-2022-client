import React from "react";
import { AiFillGithub, AiFillLinkedin } from "react-icons/ai";

const SocialMedia = () => {
  return (
    <div className="app__social">
      <a
        href="https://github.com/TrietTruong211"
        target="_blank"
        rel="noreferrer"
      >
        <div>
          <AiFillGithub />
        </div>
      </a>
      <a
        href="https://www.linkedin.com/in/triet-truong-minh-847971189"
        target="_blank"
        rel="noreferrer"
      >
        <div>
          <AiFillLinkedin />
        </div>
      </a>
    </div>
  );
};

export default SocialMedia;
