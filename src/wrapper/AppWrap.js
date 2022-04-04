import React, { useState, useEffect } from "react";

import { urlFor, client } from "../client";
import { NavigationDots, SocialMedia } from "../components";

const AppWrap = (Component, idName, classNames) =>
  function HOC() {
    const [resume, setResume] = useState("");

    useEffect(() => {
      const query = `*[_type == "miscellaneous"] {
        "resume" : resume.asset->url }`;
      client.fetch(query).then((data) => {
        setResume(data[0].resume);
      });
    }, []);

    return (
      <div id={idName} className={`app__container ${classNames}`}>
        <SocialMedia />
        <div className="app__wrapper app__flex">
          <Component />
          <div className="copyright">
            <a className="resume-link" href={resume} download>
              <p className="p-text">
                DOWNLOAD <br /> RESUME
              </p>
            </a>
            {/* <p className="p-text">All rights reserved</p> */}
          </div>
        </div>
        <NavigationDots active={idName} />
      </div>
    );
  };

export default AppWrap;
