import Cropper from "react-easy-crop";
import { Modal, Button } from "react-bootstrap";
import { useState, useCallback } from "react";
import getCroppedImg from "../../utils/cropUtils";

const CropImageModal = ({ imageSrc, onSave, onClose }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleSave = async () => {
    const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
    onSave(croppedImage);
  };

  return (
    <Modal show onHide={onClose} size="lg" centered>
      <Modal.Body style={{ height: 400, position: "relative" }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={3 / 4} // 150x200
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleSave}>Recortar</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CropImageModal;
