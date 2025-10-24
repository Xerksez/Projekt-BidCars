import Link from "next/link";
import BidForm from "@/components/BidForm";
import BidStream from "@/components/BidStream";
import LiveStatus from "@/components/LiveStatus";
import Image from "next/image";
import PhotoDeleteButton from "@/components/PhotoDeleteButton";
import { apiFetchServer, getMeSSR, API } from "@/lib/api-server";
import PhotoUploader from "@/components/PhotoUploader";

export const dynamic = "force-dynamic";

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function getAuction(id: string) {
  const res = await apiFetchServer(`/auctions/${id}`);
  return { ok: res.ok, status: res.status, data: await safeJson(res) };
}
async function getBids(id: string) {
  const res = await apiFetchServer(`/bids/auction/${id}`);
  return { ok: res.ok, status: res.status, data: await safeJson(res) };
}
async function getUsers() {
  const res = await apiFetchServer(`/users`);
  return { ok: res.ok, status: res.status, data: await safeJson(res) };
}
async function getPhotos(id: string) {
  const res = await apiFetchServer(`/photos/auction/${id}`);
  if (!res.ok) return [];
  return (await res.json()) as any[];
}

export default async function AuctionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [auctionRes, bidsRes, usersRes, photos, me] = await Promise.all([
    getAuction(id),
    getBids(id),
    getUsers(),
    getPhotos(id),
    getMeSSR(),
  ]);
  const isAdmin = me?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Aukcja</h1>
        <Link href="/" className="text-sm underline underline-offset-4">
          ← Powrót
        </Link>
      </div>

      {auctionRes.ok && <BidStream auctionId={auctionRes.data.id} />}

      {!auctionRes.ok && (
        <div className="rounded border border-red-400 bg-red-50 p-4 text-sm text-red-800">
          <div className="font-semibold mb-1">Nie udało się pobrać aukcji</div>
          <div>
            <b>API:</b> {API}
          </div>
          <div>
            <b>ID:</b> {id}
          </div>
          <div>
            <b>Status:</b> {auctionRes.status}
          </div>
          <div>
            <b>Message:</b>{" "}
            {typeof auctionRes.data?.message === "string"
              ? auctionRes.data.message
              : JSON.stringify(auctionRes.data)}
          </div>
        </div>
      )}

      {auctionRes.ok && (
        <>
          <LiveStatus
            startsAt={auctionRes.data.startsAt}
            endsAt={auctionRes.data.endsAt}
            status={auctionRes.data.status}
          />

          <AuctionView
            auction={auctionRes.data}
            bidsOk={bidsRes.ok}
            bids={bidsRes.data ?? []}
            usersOk={usersRes.ok}
            users={usersRes.data ?? []}
            photos={photos ?? []}
            isAuthed={!!me}
            isAdmin={isAdmin}
          />
        </>
      )}
    </div>
  );
}

type Phase = "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";

function AuctionView({
  auction,
  bidsOk,
  bids,
  usersOk,
  users,
  photos,
  isAuthed,
  isAdmin,
}: {
  auction: any;
  bidsOk: boolean;
  bids: any[];
  usersOk: boolean;
  users: any[];
  photos: any[];
  isAuthed: boolean;
  isAdmin: boolean;
}) {
  const now = Date.now();
  const startsAtMs = new Date(auction.startsAt).getTime();
  const endsAtMs = new Date(auction.endsAt).getTime();
  const phaseFromTime: Exclude<Phase, "CANCELLED"> =
    now < startsAtMs ? "SCHEDULED" : now >= endsAtMs ? "ENDED" : "LIVE";
  const phase: Phase = (auction?.status as Phase | undefined) ?? phaseFromTime;

  const isLive = phase === "LIVE";
  const isEnded = phase === "ENDED";

  const minAmount = Number(auction?.currentPrice ?? 0) + 100;

  return (
    <>
      <div className="rounded border p-4">
        <h2 className="font-semibold mb-3">Zdjęcia</h2>
        {isAdmin && (
          <div className="mb-4">
            <PhotoUploader auctionId={auction.id} />
          </div>
        )}
        {photos?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {photos.map((p: any) => {
              const base =
                process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
              const src = p?.url?.startsWith("http")
                ? p.url
                : `${base}${p?.url ?? ""}`;

              return (
                <div
                  key={p.id}
                  className="relative aspect-video overflow-hidden rounded border"
                >
                  <Image
                    src={src}
                    alt={auction.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                  <PhotoDeleteButton id={p.id} />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm opacity-70">Brak zdjęć.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded border p-4">
          <div className="text-sm opacity-70">Tytuł</div>
          <div className="font-medium">{auction.title}</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-sm opacity-70">VIN</div>
          <div className="font-medium">{auction.vin ?? "—"}</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-sm opacity-70">Okres</div>
          <div className="font-medium">
            {new Date(auction.startsAt).toLocaleString()} →{" "}
            {new Date(auction.endsAt).toLocaleString()}
          </div>
        </div>
        <div className="rounded border p-4">
          <div className="text-sm opacity-70">Cena bieżąca</div>
          <div className="font-semibold text-lg">${auction.currentPrice}</div>
        </div>
      </div>

      <div className="rounded border p-4">
        <h2 className="font-semibold mb-3">Złóż ofertę</h2>

        {usersOk && users.length > 0 ? (
          <BidForm
            auctionId={auction.id}
            minAmount={minAmount}
            isAuthed={isAuthed}
            disabled={!isLive}
          />
        ) : (
          <p className="text-sm opacity-70">
            Brak użytkowników. Dodaj przez POST /users.
          </p>
        )}

        {!isLive && (
          <p className="text-xs opacity-70 mt-2">
            Licytacja niedostępna:{" "}
            {isEnded
              ? "aukcja zakończona"
              : "aukcja jeszcze się nie rozpoczęła"}
            .
          </p>
        )}
      </div>

      <div className="rounded border p-4">
        <h2 className="font-semibold mb-3">Ostatnie oferty</h2>
        {bidsOk ? (
          bids?.length ? (
            <ul className="space-y-2">
              {bids.map((b: any) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between border rounded p-3"
                >
                  <div className="text-sm">
                    <div className="font-medium">${b.amount}</div>
                    <div className="opacity-70 text-xs">
                      {new Date(b.createdAt).toLocaleString()} •{" "}
                      {b.user?.name ?? b.user?.email}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm opacity-70">Brak ofert.</p>
          )
        ) : (
          <p className="text-sm text-red-600">
            Nie udało się pobrać listy ofert.
          </p>
        )}
      </div>
    </>
  );
}
