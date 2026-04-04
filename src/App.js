import React from "react";
import { About, Footer, Header, Skills, Testimonial, Work } from "./container";
import { Navbar, ChatWidget } from "./components";
import "./App.scss";

const App = () => {
  return (
    <div className="app">
      <Navbar />
      <Header />
      <About />
      <Work />
      <Skills />
      {/* <Testimonial /> */}
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default App;
