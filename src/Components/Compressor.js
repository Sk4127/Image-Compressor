import React, { useState, useEffect } from 'react';
import { Navbar, Card, Spinner, Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faDownload, faUpload, faImage as faImagePlaceholder } from '@fortawesome/free-solid-svg-icons';
import './Compressor.css';
import { compress } from 'image-conversion';

function CompressorComp() {
    const [compressedLink, setCompressedLink] = useState('');
    const [originalImage, setOriginalImage] = useState(null);
    const [originalLink, setOriginalLink] = useState('');
    const [uploadImage, setUploadImage] = useState(false);
    const [outputFileName, setOutputFileName] = useState('');
    const [compressionQuality, setCompressionQuality] = useState(0.8);
    const [originalSize, setOriginalSize] = useState(0);
    const [compressedSize, setCompressedSize] = useState(0);
    const [isCompressed, setIsCompressed] = useState(false);
    const [compressionInProgress, setCompressionInProgress] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [compressedHistory, setCompressedHistory] = useState([]);
    const [showCompressedImage, setShowCompressedImage] = useState(false);
    const [modalShow, setModalShow] = useState(false);
    const [compressionPercentage, setCompressionPercentage] = useState(50); // Default 50%

    useEffect(() => {
        if (originalImage) {
            setCompressedLink('');
            setCompressedSize(0);
            setIsCompressed(false);
            setShowCompressedImage(false);
        }
    }, [originalImage]);

    async function uploadLink(event) {
        const imageFile = event.target.files[0];
        setOriginalLink(URL.createObjectURL(imageFile));
        setOriginalImage(imageFile);
        setOutputFileName(imageFile.name);
        setUploadImage(true);
        setOriginalSize(imageFile.size);
    }

    async function compressImage() {
        if (!originalImage) {
            alert('Please upload an image first.');
            return;
        }

        try {
            setCompressionInProgress(true);
            setShowCompressedImage(false);
            setLoading(true);
            setIsCompressed(false);

            // Load the image to get its original dimensions
            const img = new Image();
            img.src = URL.createObjectURL(originalImage);
            await new Promise((resolve) => (img.onload = resolve));
            const originalWidth = img.width;
            const originalHeight = img.height;

            // Set the target size based on the selected compression percentage
            const targetSize = originalSize * (compressionPercentage / 100);
            let currentQuality = compressionQuality;
            let compressedImage;
            let compressionAttempts = 0;

            // Compress in a loop until the target size is met or quality drops below a threshold
            do {
                compressedImage = await compress(originalImage, {
                    quality: currentQuality,
                    width: originalWidth, // Maintain original width
                    height: originalHeight, // Maintain original height
                });

                setCompressedSize(compressedImage.size);
                compressionAttempts++;

                // Reduce quality if the compressed image size is larger than the target
                if (compressedImage.size > targetSize) {
                    currentQuality -= 0.05; // Reduce quality incrementally
                }

                // Prevent infinite loop
                if (compressionAttempts >= 10) {
                    break;
                }
            } while (compressedImage.size > targetSize && currentQuality > 0.1);

            setCompressedLink(URL.createObjectURL(compressedImage));
            setIsCompressed(true);
            setCompressedHistory([...compressedHistory, { link: URL.createObjectURL(compressedImage), name: outputFileName }]);

            setTimeout(() => {
                setLoading(false);
                setShowCompressedImage(true);
            }, 2000);
        } catch (error) {
            console.error('Image compression failed:', error);
            alert('Image compression failed. Please try again.');
        } finally {
            setCompressionInProgress(false);
        }
    }

    function resetApp() {
        setOriginalLink('');
        setOriginalImage(null);
        setUploadImage(false);
        setOutputFileName('');
        setCompressionQuality(0.8);
        setOriginalSize(0);
        setCompressedSize(0);
        setIsCompressed(false);
        setCompressedLink('');
        setShowCompressedImage(false);
    }

    function toggleHelp() {
        setShowHelp(!showHelp);
    }

    function toggleHistory() {
        setShowHistory(!showHistory);
    }

    return (
        <div className="mainContainer">
            <Navbar className="navbar justify-content-between" bg="lig" variant="dark">
                <div>
                    <Navbar.Brand className="navbar-content">
                        <center>
                            <FontAwesomeIcon icon={faImage} className="icon" />
                            Image Compressor
                        </center>
                    </Navbar.Brand>
                </div>
                <div className="navbar-actions">
                    <button className="help-icon" onClick={toggleHelp}>Help</button>
                    <button className="history-icon" onClick={toggleHistory}>History</button>
                </div>
            </Navbar>

            {showHelp && (
                <div className="help-container">
                    <p>Instructions:</p>
                    <ul>
                        <li>Upload an image using the "Upload a file" button.</li>
                        <li>Adjust the compression percentage using the slider (10% to 90%).</li>
                        <li>Press the "Compress" button to start the compression.</li>
                        <li>Download the compressed image using the "Download" button.</li>
                    </ul>
                </div>
            )}

            {showHistory && (
                <div className="history-container">
                    <p>Compressed History:</p>
                    <ul>
                        {compressedHistory.map((item, index) => (
                            <li key={index}>
                                <a href={item.link} download={item.name}>{item.name}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="row mt-5">
                <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                    {uploadImage ? (
                        <Card.Img className="image" variant="top" src={originalLink} alt="Original Image" />
                    ) : (
                        <Card.Img className="uploadCard" variant="top" src={faUpload} alt="" />
                    )}
                    <div className="d-flex justify-content-center upload-btn-wrapper">
                        <label htmlFor="uploadBtn" className="btn btn-primary">
                            <FontAwesomeIcon icon={faUpload} className="icon" />
                            Upload file
                        </label>
                        <input type="file" id="uploadBtn" accept="image/*" className="mt-2 btn btn-primary w-75" onChange={uploadLink} />
                    </div>
                </div>

                <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 d-flex justify-content-center align-items-baseline">
                    <div>
                        {outputFileName && (
                            <div>
                                <label htmlFor="compressionSlider">Compression Percentage: {compressionPercentage}%</label>
                                <input
                                    id="compressionSlider"
                                    type="range"
                                    min="10"
                                    max="90"
                                    step="1"
                                    value={compressionPercentage}
                                    onChange={(event) => setCompressionPercentage(parseInt(event.target.value))}
                                />
                                <div className="text-center">
                                    Original Size: {Math.round(originalSize / 1024)} KB
                                    <br />
                                    Compressed Size: {Math.round(compressedSize / 1024)} KB
                                </div>
                                <div className="text-center">
                                    {loading ? (
                                        <div className="text-success compressed-message">
                                            Compressing image...
                                        </div>
                                    ) : isCompressed && !compressionInProgress ? (
                                        <div className="text-success compressed-message">
                                            Image compressed successfully!
                                        </div>
                                    ) : null}
                                </div>
                                <div className="button-container">
                                    {loading ? null : (
                                        <button type="button" className="btn btn-success" onClick={compressImage}>
                                            <FontAwesomeIcon icon={faImage} className="icon" />
                                            Compress
                                        </button>
                                    )}
                                    <button type="button" className="btn btn-danger ml-3" onClick={resetApp}>
                                        Reset
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                    {showCompressedImage ? (
                        <div>
                            <Card.Img className="image" variant="top" src={compressedLink} alt="Compressed Image" onClick={() => setModalShow(true)} style={{ cursor: 'pointer' }} />
                            <a href={compressedLink} download={outputFileName} className="mt-2 btn btn-success w-75 download-btn">
                                <FontAwesomeIcon icon={faDownload} className="icon" />
                                Download
                            </a>
                        </div>
                    ) : (
                        <Card.Img className="uploadCard" variant="top" src={faImagePlaceholder} alt="" />
                    )}
                </div>
            </div>
        </div>
    );
}

export default CompressorComp;
