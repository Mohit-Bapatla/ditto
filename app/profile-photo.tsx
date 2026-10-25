"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";

export function Avatar({
  person,
}: {
  person: { name: string; photo?: string | null };
}) {
  return person.photo ? (
    <img
      className="person-photo"
      src={person.photo}
      alt={`${person.name}'s profile`}
    />
  ) : (
    <>{person.name.trim().slice(0, 1).toUpperCase() || "D"}</>
  );
}
export function ProfilePhotoInput({
  photo,
  name,
  onBusy,
}: {
  photo?: string | null;
  name: string;
  onBusy: (busy: boolean) => void;
}) {
  const [value, setValue] = useState(photo || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const upload = useRef<HTMLInputElement>(null),
    camera = useRef<HTMLInputElement>(null);
  const sequence = useRef(0);
  const source = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState({ zoom: 1, vertical: 50, horizontal: 50 });
  const [canCrop, setCanCrop] = useState(false);
  function renderCrop(image: HTMLImageElement, next: typeof crop) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw Error("Photo editing is unavailable. Try another browser.");
    const side = Math.min(image.naturalWidth, image.naturalHeight) / next.zoom;
    ctx.drawImage(image, (image.naturalWidth - side) * next.horizontal / 100,
      (image.naturalHeight - side) * next.vertical / 100,
      side, side, 0, 0, 256, 256);
    setValue(canvas.toDataURL("image/jpeg", 0.85));
    setCrop(next);
  }
  useEffect(
    () => () => {
      sequence.current++;
      onBusy(false);
    },
    [onBusy],
  );
  async function select(file?: File) {
    if (!file) return;
    const current = ++sequence.current;
    setError("");
    setLoading(true);
    onBusy(true);
    let url = "";
    try {
      if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024)
        throw Error("Choose an image smaller than 15 MB.");
      url = URL.createObjectURL(file);
      const image = new Image();
      image.src = url;
      await image.decode();
      if (current === sequence.current) {
        source.current = image;
        renderCrop(image, { zoom: 1, vertical: 50, horizontal: 50 });
        setCanCrop(true);
      }
    } catch (e) {
      if (current === sequence.current)
        setError(
          e instanceof Error && e.message.startsWith("Choose")
            ? e.message
            : "This photo format isn’t supported here. Try a JPG or PNG.",
        );
    } finally {
      if (url) URL.revokeObjectURL(url);
      if (current === sequence.current) {
        setLoading(false);
        onBusy(false);
      }
    }
  }
  return (
    <fieldset className="profile-photo-editor">
      <legend>Profile picture</legend>
      <div className="photo-editor-row">
        <span className="photo-preview">
          <Avatar person={{ name, photo: value }} />
        </span>
        <div className="photo-options">
          <button
            type="button"
            className="secondary"
            disabled={loading}
            onClick={() => camera.current?.click()}
          >
            <Camera size={17} />
            Take a photo
          </button>
          <button
            type="button"
            className="secondary"
            disabled={loading}
            onClick={() => upload.current?.click()}
          >
            <Upload size={17} />
            Upload a picture
          </button>
        </div>
      </div>
      <input
        ref={upload}
        type="file"
        accept="image/*"
        aria-label="Upload profile picture"
        hidden
        onChange={(e) => {
          void select(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="user"
        aria-label="Take profile picture"
        hidden
        onChange={(e) => {
          void select(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {canCrop && <div className="photo-crop-controls">
        <label>Zoom<input aria-label="Photo zoom" type="range" min="1" max="2.5" step="0.05" value={crop.zoom} onChange={e => source.current && renderCrop(source.current, { ...crop, zoom: Number(e.target.value) })}/></label>
        <label>Horizontal position<input aria-label="Photo horizontal position" type="range" min="0" max="100" step="1" value={crop.horizontal} onChange={e => source.current && renderCrop(source.current, { ...crop, horizontal: Number(e.target.value) })}/></label>
        <label>Vertical position<input aria-label="Photo vertical position" type="range" min="0" max="100" step="1" value={crop.vertical} onChange={e => source.current && renderCrop(source.current, { ...crop, vertical: Number(e.target.value) })}/></label>
      </div>}
      <input type="hidden" name="photo" value={value} />
      {loading && <p role="status">Preparing your picture…</p>}
      {value && (
        <button
          type="button"
          className="text-link"
          onClick={() => {
            sequence.current++;
            setValue("");
            setCanCrop(false);
            source.current = null;
            setLoading(false);
            onBusy(false);
          }}
        >
          <X size={14} />
          Remove photo
        </button>
      )}
      <p className="small muted">
        Saved with your profile. Visible to people in your Circles. Location
        metadata is removed.
      </p>
      {error && (
        <p role="alert" className="photo-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
