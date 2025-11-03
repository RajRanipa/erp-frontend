'use client';

import { use, useEffect } from "react";


export default function Batch(initial) {
    useEffect(() => {
        console.log('initial', initial.initial);
        // initial = initial.initial
    },[initial.initial])
  return (
      <div className="max-w-3xl">
          {Array.isArray(initial.initial) && initial.initial.map((item) => (
            <div key={item._id} className="border p-4 mb-4 rounded">
              <p><strong>Batch ID:</strong> {item.batche_id}</p>
              <p><strong>Date:</strong> {new Date(item.date).toLocaleDateString()}</p>
              <p><strong>Number of Batches:</strong> {item.numbersBatches}</p>
              <div>
                <strong>Raw Materials:</strong>
                <div className="list-disc ml-6">
                  {item.rawMaterials?.map((rm, idx) => (
                    <p key={idx}>{idx + 1}. {rm.rawMaterial}</p>
                  ))}
                </div>
              </div>
              <p><strong>Created At:</strong> {new Date(item.createdAt).toLocaleString()}</p>
              <p><strong>Updated At:</strong> {new Date(item.updatedAt).toLocaleString()}</p>
            </div>
          ))}
      </div>
  );
}