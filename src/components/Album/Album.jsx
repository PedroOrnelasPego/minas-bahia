// components/Album/Album.jsx
import { useState } from "react";
import PhotoAlbum from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "./Album.scss";

// eslint-disable-next-line react/prop-types
const Album = ({ photos }) => {
  const [index, setIndex] = useState(-1);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <PhotoAlbum
        layout="rows"
        photos={photos}
        targetRowHeight={1}
        onClick={({ index }) => setIndex(index)}
      />

      {index >= 0 && (
        <Lightbox
          slides={photos}
          open={index >= 0}
          index={index}
          close={() => setIndex(-1)}
        />
      )}
    </div>
  );
};

export default Album;
