import { useEffect, useState } from "react";
import { CameraIcon, PencilSquareIcon } from "@heroicons/react/24/outline";

const PREVIEW_SIZE = 288;

const ProfileCard = ({ user, onSave, saving, onUploadPhoto, uploadingPhoto }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");

  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState("");
  const [selectedPhotoMeta, setSelectedPhotoMeta] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    if (!editing) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user, editing]);

  useEffect(
    () => () => {
      if (selectedPhotoUrl) {
        URL.revokeObjectURL(selectedPhotoUrl);
      }
    },
    [selectedPhotoUrl]
  );

  const startEdit = () => {
    setName(user.name || "");
    setEmail(user.email || "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setName(user.name || "");
    setEmail(user.email || "");
    setEditing(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    const ok = await onSave({ name, email });
    if (ok) {
      setEditing(false);
    }
  };

  const openPhotoEditor = (file) => {
    if (!file) return;

    if (selectedPhotoUrl) {
      URL.revokeObjectURL(selectedPhotoUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedPhotoUrl(previewUrl);
    setSelectedPhotoMeta({ width: 0, height: 0 });
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setShowPhotoEditor(true);
  };

  const closePhotoEditor = () => {
    if (selectedPhotoUrl) {
      URL.revokeObjectURL(selectedPhotoUrl);
    }
    setSelectedPhotoUrl("");
    setSelectedPhotoMeta({ width: 0, height: 0 });
    setShowPhotoEditor(false);
  };

  const createCroppedBlob = () =>
    new Promise((resolve, reject) => {
      if (!selectedPhotoUrl) {
        reject(new Error("No photo selected"));
        return;
      }

      const image = new Image();
      image.onload = () => {
        const size = 320;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);

        const fitScale = Math.min(size / image.width, size / image.height);
        const drawW = image.width * fitScale * zoom;
        const drawH = image.height * fitScale * zoom;
        const x = (size - drawW) / 2 + offsetX;
        const y = (size - drawH) / 2 + offsetY;

        ctx.drawImage(image, x, y, drawW, drawH);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to generate image"));
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          0.92
        );
      };
      image.onerror = () => reject(new Error("Failed to load selected image"));
      image.src = selectedPhotoUrl;
    });

  const saveEditedPhoto = async () => {
    try {
      const blob = await createCroppedBlob();
      const ok = await onUploadPhoto(blob);
      if (ok) {
        closePhotoEditor();
      }
    } catch (err) {
      console.error("Photo processing failed", err);
      alert("Failed to process selected photo");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 text-center">
      <div className="relative w-fit mx-auto">
        <div className="w-34 h-32 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center text-4xl font-bold text-indigo-600">
          {user.profilePhoto ? (
            <img
              src={`http://localhost:5000${user.profilePhoto}`}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            (user.name || "S").charAt(0).toUpperCase()
          )}
        </div>

        <label className="absolute -right-2 -bottom-1 w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center cursor-pointer">
          <CameraIcon className="h-5 w-5 text-slate-600" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => openPhotoEditor(e.target.files?.[0])}
          />
        </label>
      </div>

      {uploadingPhoto && <p className="mt-3 text-sm text-slate-500">Uploading photo...</p>}

      {!editing ? (
        <>
          <h2 className="mt-4 text-xl font-semibold">{user.name}</h2>
          <p className="text-gray-500">{user.email}</p>

          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p>
              <strong>Role:</strong> {user.role}
            </p>
          </div>

          <button
            onClick={startEdit}
            className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 inline-flex items-center justify-center gap-2"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit Profile
          </button>
        </>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3 text-left">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={cancelEdit}
            className="w-full border py-2 rounded-lg text-gray-700"
          >
            Cancel
          </button>
        </form>
      )}

      {showPhotoEditor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 text-left">
            <h3 className="text-xl font-semibold mb-1">Edit Photo Before Upload</h3>
            <p className="text-sm text-slate-500 mb-4">
              Adjust position and zoom, then upload.
            </p>

            <div className="flex justify-center mb-4">
              <div className="w-72 h-72 rounded-full overflow-hidden border border-slate-200 relative bg-slate-100">
                <img
                  src={selectedPhotoUrl}
                  alt="Preview"
                  onLoad={(e) =>
                    setSelectedPhotoMeta({
                      width: e.currentTarget.naturalWidth,
                      height: e.currentTarget.naturalHeight,
                    })
                  }
                  className="absolute"
                  style={{
                    width: selectedPhotoMeta.width
                      ? `${selectedPhotoMeta.width * Math.min(PREVIEW_SIZE / selectedPhotoMeta.width, PREVIEW_SIZE / selectedPhotoMeta.height) * zoom}px`
                      : "100%",
                    height: selectedPhotoMeta.height
                      ? `${selectedPhotoMeta.height * Math.min(PREVIEW_SIZE / selectedPhotoMeta.width, PREVIEW_SIZE / selectedPhotoMeta.height) * zoom}px`
                      : "100%",
                    left: "50%",
                    top: "50%",
                    transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm text-slate-600">
                Zoom
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </label>

              <label className="block text-sm text-slate-600">
                Move Left / Right
                <input
                  type="range"
                  min="-120"
                  max="120"
                  step="1"
                  value={offsetX}
                  onChange={(e) => setOffsetX(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </label>

              <label className="block text-sm text-slate-600">
                Move Up / Down
                <input
                  type="range"
                  min="-120"
                  max="120"
                  step="1"
                  value={offsetY}
                  onChange={(e) => setOffsetY(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </label>
            </div>

            <div className="mt-4">
              <label className="inline-flex items-center gap-2 text-sm text-indigo-600 cursor-pointer hover:text-indigo-700">
                <CameraIcon className="h-4 w-4" />
                Choose another image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => openPhotoEditor(e.target.files?.[0])}
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closePhotoEditor}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditedPhoto}
                disabled={uploadingPhoto}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl disabled:opacity-60"
              >
                {uploadingPhoto ? "Uploading..." : "Upload Photo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
