//! Codama emits `crate::generated::…` paths; generated sources live in `rust/`.
#[path = "rust/mod.rs"]
pub mod generated;

pub use generated::*;
pub use generated::programs::SVMGOV_ID;
