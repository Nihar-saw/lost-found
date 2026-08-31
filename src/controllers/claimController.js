import * as claimService from "../services/claimService.js";

export const createClaim = async (req, res, next) => {
  try {
    const { matchId, foundItemId } = req.body;

    const claim = await claimService.createClaim({
      claimantId: req.user._id,
      matchId,
      foundItemId,
    });

    res.status(201).json({
      success: true,
      message: "Claim request submitted",
      claim,
    });
  } catch (error) {
    next(error);
  }
};

export const setQuestion = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    const claim = await claimService.setVerificationQuestion({
      claimId: req.params.id,
      finderId: req.user._id,
      question,
    });

    res.json({
      success: true,
      message: "Verification question sent to claimant",
      claim,
    });
  } catch (error) {
    next(error);
  }
};

export const submitAnswer = async (req, res, next) => {
  try {
    const { answer } = req.body;
    if (!answer) {
      return res.status(400).json({ success: false, message: "Answer is required" });
    }

    const claim = await claimService.submitClaimantAnswer({
      claimId: req.params.id,
      claimantId: req.user._id,
      answer,
    });

    res.json({
      success: true,
      message: "Answer submitted to finder",
      claim,
    });
  } catch (error) {
    next(error);
  }
};

export const approveClaim = async (req, res, next) => {
  try {
    const claim = await claimService.approveClaim({
      claimId: req.params.id,
      finderId: req.user._id,
    });

    res.json({
      success: true,
      message: "Ownership verified and claim approved",
      claim,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectClaim = async (req, res, next) => {
  try {
    const claim = await claimService.rejectClaim({
      claimId: req.params.id,
      finderId: req.user._id,
    });

    res.json({
      success: true,
      message: "Claim rejected",
      claim,
    });
  } catch (error) {
    next(error);
  }
};

export const markReturned = async (req, res, next) => {
  try {
    const claim = await claimService.markItemReturned({
      claimId: req.params.id,
      userId: req.user._id,
    });

    res.json({
      success: true,
      message: "Item marked as returned and resolved",
      claim,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyClaims = async (req, res, next) => {
  try {
    const claims = await claimService.getUserClaims(req.user._id);
    res.json({
      success: true,
      count: claims.length,
      claims,
    });
  } catch (error) {
    next(error);
  }
};